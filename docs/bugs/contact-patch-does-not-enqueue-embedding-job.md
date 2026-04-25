# Contact PATCH does not enqueue an embedding job

**Flow:** 08 — Update Contact (with embedding pipeline 32)
**Severity:** Medium-High (search index goes stale on every PATCH)
**Status:** Open

## Symptom

Flow 08 step 5:

> A diff over the embedded text fields is computed. If any changed,
> an `EmbeddingJob { contactId }` is written to the channel so the
> worker regenerates the vector.

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs`:

```csharp
app.MapPatch("/api/contacts/{id:guid}", [Authorize] async (
    Guid id, PatchContactRequest req, AppDbContext db) =>
{
    var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
    if (c is null) return Results.NotFound();
    if (req.Starred.HasValue) c.Starred = req.Starred.Value;
    if (req.Emails is not null) c.Emails = req.Emails;
    if (req.Phones is not null) c.Phones = req.Phones;
    await db.SaveChangesAsync();
    …
});
```

No `ChannelWriter<EmbeddingJob>` injection, no
`embeddingWriter.WriteAsync(...)` call. The endpoint commits the
update and returns. Yet the `EmbeddingWorker`'s contact `sourceText`
includes emails:

```csharp
sourceText = $"{c.DisplayName}\n{c.Role ?? ""} · {c.Organization ?? ""}\n{c.Location ?? ""}\nTags: {string.Join(", ", c.Tags)}\nEmails: {string.Join(", ", c.Emails)}";
```

So when a user PATCHes their own emails (e.g., adds `john@stripe.com`),
the embedding row keeps the old hash + old vector. Vector search no
longer reflects the new email content until something else triggers a
re-embed (which currently is nothing — there's no auto-reconciler).

## Expected

After a successful PATCH that mutates any field present in the
worker's `sourceText` (emails today; in the future also tags,
displayName, etc.), the endpoint enqueues an
`EmbeddingJob(contactId, ownerUserId, "contact")`. Flow 32's
hash-based idempotency means a no-op PATCH (no change) still gets
short-circuited inside the worker.

## Actual

PATCH never enqueues. The vector grows stale over time as emails
churn.

## Repro

1. Create a contact via POST with email `old@example.com`.
2. Wait for the worker to produce the initial embedding; record its
   `content_hash`.
3. PATCH the contact: `{ "emails": ["new@example.com"] }`. Wait
   briefly.
4. Re-read the contact embedding row. `content_hash` is unchanged
   from step 2; the vector is the old vector.

## Notes

Radically simple fix:

- Add `ChannelWriter<EmbeddingJob> embeddingWriter` and
  `ICurrentUser current` to the PATCH endpoint's DI parameters.
- After `SaveChangesAsync`, write the job:
  `await embeddingWriter.WriteAsync(new EmbeddingJob(c.Id, current.UserId!.Value, "contact"));`
- The worker's idempotency check (hash + model) means a PATCH that
  only changes `Starred` writes the job, the worker computes the
  same hash, and short-circuits — no provider call, no DB write.
