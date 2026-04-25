# `PATCH /api/contacts/{id}` does not invalidate the per-owner stack count cache

**Flow:** 24 — Smart Stacks (View and Open)
**Severity:** Medium-high (every other write path that affects stack membership — `POST /api/contacts`, `DELETE /api/contacts/{id}`, `POST /api/contacts/import` — calls `stackCache.InvalidateOwner(...)` after saving. PATCH is the one that's missing it. Tag edits and display-name edits both shift stack membership: tags drive the `Tag`-kind stacks ("AI founders"), and display-name tokens drive the `Query`-kind stacks ("Close friends"). After a PATCH, the home screen's `Smart stacks` row shows stale counts for up to the cache TTL — currently 5 minutes — even though the user just made the change in the same browser session.)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` — the PATCH handler:

```csharp
app.MapPatch("/api/contacts/{id:guid}", [Authorize] async (
    Guid id, PatchContactRequest req, AppDbContext db,
    ChannelWriter<EmbeddingJob> embeddingWriter, ICurrentUser current) =>
{
    var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
    if (c is null) return Results.NotFound();
    // … validation …
    if (req.Tags is not null) { c.Tags = req.Tags; needsEmbedding = true; }
    // … other field assignments …

    await db.SaveChangesAsync();
    if (needsEmbedding)
        await embeddingWriter.WriteAsync(new EmbeddingJob(c.Id, current.UserId!.Value, "contact"));

    // (no StackCountCache invalidation)
    return Results.Ok(ContactDetailDto.From(c, …));
});
```

The handler doesn't inject `StackCountCache` at all — the parameter is absent from the signature — so there's no way for it to call `InvalidateOwner`. The other three contact-mutating handlers all do:

```csharp
// POST /api/contacts (create)
await db.SaveChangesAsync();
stackCache.InvalidateOwner(current.UserId!.Value);

// DELETE /api/contacts/{id}
await db.SaveChangesAsync();
stackCache.InvalidateOwner(current.UserId!.Value);

// POST /api/contacts/import
if (imported > 0) stackCache.InvalidateOwner(ownerId);
```

The cache TTL is 5 minutes (`StackCountCacheOptions.Ttl = TimeSpan.FromMinutes(5)` at `Stacks/StackCountCache.cs:7`), so a stale count can persist for that long.

## Why both Tags and DisplayName edits matter

Looking at `StackCountCalculator`:

- `StackKind.Tag` counts via `c.Tags.Contains(stack.Definition)` — adding/removing a tag with a name matching any seeded `Tag`-kind stack (default seed includes "AI founders" via `Query` kind, but a user could create a `Tag`-kind stack at any time) flips membership.
- `StackKind.Query` counts via tokens that match `c.DisplayName.ToLower().Contains(t)` **or** any tag — so renaming a contact "Joe" → "Joe AI Founder" also changes the count for any `Query`-kind stack whose definition tokenizes to overlap.
- `StackKind.Classification` (e.g., `intros_owed`) is interaction-driven, so contact PATCH doesn't directly affect it. But it does flow through if the patch changes nothing on tags/displayName — the cache would still be safe to invalidate.

The simplest correct rule is: any contact mutation must invalidate the per-owner cache. The current state matches this rule for POST, DELETE, and import; PATCH is the leak.

## Expected

After a successful PATCH, the per-owner cache entries are removed so the next `GET /api/stacks` recomputes fresh counts:

```csharp
app.MapPatch("/api/contacts/{id:guid}", [Authorize] async (
    Guid id, PatchContactRequest req, AppDbContext db,
    ChannelWriter<EmbeddingJob> embeddingWriter, ICurrentUser current,
    StackCountCache stackCache) =>           // <-- inject the cache
{
    // … existing handler body …
    await db.SaveChangesAsync();
    if (needsEmbedding)
        await embeddingWriter.WriteAsync(...);
    stackCache.InvalidateOwner(current.UserId!.Value);   // <-- new line
    // … return …
});
```

`InvalidateOwner` clears all entries for `(userId, *)` in O(N) over keys, where N is small (one per user-defined stack — default seed has 3). Cheap.

## Actual

1. User registers, gets the default 3 stacks seeded ("AI founders" `Query`, "Intros owed" `Classification`, "Close friends" `Query`).
2. User creates contact `Alice` with no tags. `POST /api/contacts` → cache invalidated → next `GET /api/stacks` recomputes (returns 0 for "AI founders" because Alice's name and tags don't match).
3. User PATCHes Alice with `tags: ["AI founders"]`. The DB row is updated correctly. The contact embedding job is enqueued correctly.
4. **The stack-count cache is not touched.** `GET /api/stacks` within 5 minutes returns the cached count of 0.
5. The home screen continues to hide the "AI founders" stack (the SPA filters `count > 0`).
6. Five minutes pass; next `GET /api/stacks` recomputes; the card finally appears.

In a real session a user expects "I tagged this contact AI founders, and now the AI founders stack should show up on home" — at most one round-trip later. They get a 5-minute lag instead.

## Repro (as an integration test)

```csharp
[Fact]
public async Task Patch_contact_invalidates_stack_count_cache()
{
    var (client, userId, cookie) = await RegisterLogin();
    var stackId = ...; // pick the seeded "AI founders" Query-kind stack id

    // Create a contact whose name doesn't match any default stack token
    var contactId = await CreateContact(client, cookie, "Plain Person", tags: Array.Empty<string>());

    // Prime cache: GET /api/stacks → sees count 0 for "AI founders" (hidden)
    var before = await GetStacks(client, cookie);
    Assert.DoesNotContain(before, s => s.Name == "AI founders");

    // PATCH adds the matching tag
    await PatchContactTags(client, cookie, contactId, new[] { "AI founders" });

    // Re-fetch immediately — the cache should have been invalidated, not stale
    var after = await GetStacks(client, cookie);
    Assert.Contains(after, s => s.Name == "AI founders" && s.Count >= 1);
}
```

This test fails today (the second `GetStacks` returns the cached 0-count list). After adding `stackCache.InvalidateOwner` to the PATCH handler, it passes.

## Notes

The fix is small and self-contained. The interactions-related endpoints (`POST/PATCH/DELETE` on interactions) have a similar issue for the `intros_owed` classification, since its membership depends on each contact's latest interaction type and date — but I'm filing this PATCH-contact bug separately because it's the most direct user action ("I just edited this contact's tags") and the highest-impact case (Query/Tag-kind stacks are the bulk of what users see). Interaction-driven cache invalidation can be a follow-up.

Existing acceptance test in `StacksTests` doesn't cover the PATCH path, only POST/DELETE/import.
