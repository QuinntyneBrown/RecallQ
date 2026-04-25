# CSV bulk import doesn't invalidate the per-owner stack count cache

**Flow:** 31 — CSV Bulk Import (interaction with flow 24 — Smart Stacks)
**Severity:** Medium (a user who just imported 100 contacts tagged "AI founders" returns to /home and sees the stale pre-import count next to their newly-relevant Smart Stack — for up to 5 minutes — eroding the "import then look around" loop)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` POST handler invalidates the cache after `SaveChangesAsync`:

```csharp
db.Contacts.Add(contact);
await db.SaveChangesAsync();
stackCache.InvalidateOwner(current.UserId!.Value);
…
```

The DELETE handler does the same. The PATCH handler currently doesn't (debatable, since PATCH today doesn't change tags via the typical path), but it's at least an arguable coverage gap rather than a clear miss.

`backend/RecallQ.Api/Endpoints/ImportEndpoints.cs` does **not** inject or call `StackCountCache`. It batch-inserts dozens-to-thousands of contacts via the same `db.Contacts.AddRange` + `SaveChangesAsync` path that the create endpoint uses for one — but skips the cache invalidation step.

```csharp
async Task FlushAsync()
{
    if (batch.Count == 0) return;
    db.Contacts.AddRange(batch);
    await db.SaveChangesAsync();
    foreach (var c in batch) created.Add(c.Id);
    imported += batch.Count;
    batch.Clear();
}
```

Every Smart Stack count keyed against tag membership (`meet_n_tag`, `Tag` stacks like `"AI founders"`) is therefore served from an entry that pre-dates the import, until the entry's TTL (5 minutes) expires or the user POSTs/DELETEs a single contact and bumps invalidation that way.

## Expected

After a successful bulk import that produced ≥ 1 imported row, the per-owner stack cache is invalidated so the next `/api/stacks` call recomputes counts. Mirrors the create handler's behavior:

```csharp
imported += batch.Count;
batch.Clear();
…
if (imported > 0) stackCache.InvalidateOwner(ownerId);
```

(Done once at the end is sufficient — the `/api/stacks` GET only runs the calculator on cache miss, so a single invalidation per import covers any number of batches.)

## Actual

`StackCountCache` is unmodified by the import. A user who imports 100 `ai founders`-tagged rows and immediately navigates to `/home` sees the previous count for up to 5 minutes, depending on when they last triggered a refresh.

## Repro

1. Log in. Open `/home`. Note the count next to the `AI founders` Smart Stack (e.g., `3 AI founders`).
2. POST a CSV via `/api/import/contacts` containing 10 rows with `tags=ai founders`. Confirm the response is `201` with `imported: 10`.
3. Reload `/home` immediately.
4. Observe: the Smart Stack still reads `3 AI founders` (the cached value) until at least 5 minutes pass, despite the database now holding 13 such contacts.

By contrast, creating each contact one-by-one via `POST /api/contacts` invalidates the cache after every insert and the count refreshes on the next home load.

## Notes

Radically simple fix in `ImportEndpoints.cs`:

1. Add `StackCountCache stackCache` to the endpoint's DI parameters.
2. After the final `FlushAsync()` (or right before returning), call `stackCache.InvalidateOwner(ownerId)` if `imported > 0`.

```csharp
app.MapPost("/api/import/contacts", [Authorize] async (
    HttpRequest request, AppDbContext db, ICurrentUser current,
    ChannelWriter<EmbeddingJob> embeddingWriter,
    StackCountCache stackCache) =>
{
    …
    await FlushAsync();
    if (imported > 0) stackCache.InvalidateOwner(ownerId);
    foreach (var id in created)
        await embeddingWriter.WriteAsync(new EmbeddingJob(id, ownerId, "contact"));
    return Results.Json(new { imported, failed, errors }, statusCode: StatusCodes.Status201Created);
}).DisableAntiforgery();
```

A regression test: with the import endpoint stubbed, seed a contact, prime `/api/stacks` (cache hit on next call), import 1+ rows, call `/api/stacks` again, assert the count went up.
