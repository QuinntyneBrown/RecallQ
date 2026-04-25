# PATCH /api/interactions/{id} does not enqueue summary refresh

**Flow:** 13 — Update Interaction (with summary refresh flow 27)
**Severity:** Medium-High (summary goes stale on every edit)
**Status:** Open

## Symptom

Flow 13 step 4:

> If `content` or `subject` changed, an `EmbeddingJob { interactionId }`
> is enqueued. **A `SummaryRefresh { contactId }` is always enqueued
> because the aggregate changed.**

`backend/RecallQ.Api/Endpoints/InteractionsEndpoints.cs`'s PATCH:

```csharp
app.MapPatch("/api/interactions/{id:guid}", [Authorize] async (
    Guid id, PatchInteractionRequest req, AppDbContext db, ICurrentUser current,
    ChannelWriter<EmbeddingJob> emb) =>
{
    …
    await db.SaveChangesAsync();
    await emb.WriteAsync(new EmbeddingJob(i.Id, current.UserId!.Value, "interaction"));
    return Results.Ok(InteractionDto.From(i));
});
```

Only `ChannelWriter<EmbeddingJob>` is injected; no
`ChannelWriter<SummaryRefreshJob>`, no `sum.WriteAsync(...)`. So
when a user fixes a typo in a logged interaction's content or
subject, the relationship summary's underlying corpus changed but
the summary itself stays cached on the old text. The home/contact-
detail summary card will show outdated narrative until something
else (a new interaction, a delete, a manual refresh) bumps the
aggregate.

The matching `MapPost` and `MapDelete` for interactions both
enqueue `SummaryRefreshJob`; PATCH is the odd one out.

## Expected

PATCH on an interaction enqueues a `SummaryRefreshJob(contactId,
ownerUserId)` after `SaveChangesAsync`, regardless of which fields
changed. The summary worker re-runs the LLM pass over the latest
interactions for that contact.

## Actual

PATCH writes only the embedding job. The summary stays stale.

## Repro

1. Create a contact + interaction.
2. Wait for the initial summary to be generated.
3. PATCH the interaction's content (e.g., "fix typo").
4. Observe: the contact's `RelationshipSummary` row's
   `UpdatedAt` doesn't change; no `SummaryRefreshJob` lands in
   the channel.

## Notes

Radically simple fix:

- Add `ChannelWriter<SummaryRefreshJob> sum` to the PATCH
  endpoint's DI parameters.
- After `SaveChangesAsync`, write the job:
  `await sum.WriteAsync(new SummaryRefreshJob(i.ContactId, current.UserId!.Value));`
- Mirror the existing pattern in the create / delete handlers.
