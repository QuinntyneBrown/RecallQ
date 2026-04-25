# Manual summary refresh's regenerated paragraph is invisible until the user navigates away and back

**Flow:** 27 — Refresh Relationship Summary (Manual)
**Severity:** High (the entire manual-refresh flow is functionally broken when the contact's interactions haven't changed; the user taps **Refresh**, sees the same paragraph, and has no signal that a fresh one ever lands)
**Status:** Complete — `SummariesEndpoints` GET now returns `status: "pending"` when `row.LastRefreshRequestedAt > row.UpdatedAt`, so the SPA's poll loop continues across the in-flight refresh and picks up the regenerated paragraph in place. Existing `loadSummary` already keeps the prior paragraph visible across `pending` polls, so the user sees a subtle spinner instead of a wipe. New acceptance test `SummaryRefreshGatedOnLastRequestTests` seeds a 30-min-old summary, fires `:refresh`, and asserts GET returns `pending`.

## Symptom

`backend/RecallQ.Api/Endpoints/SummariesEndpoints.cs` GET endpoint:

```csharp
if (row.Paragraph is not null && row.InteractionCount != interactionCount)
{
    await writer.WriteAsync(new SummaryRefreshJob(id, current.UserId!.Value));
    return Results.Ok(new { status = "pending" });
}
…
return Results.Ok(new { status = "ready", paragraph = row.Paragraph, … });
```

It treats "stale" as "the cached `InteractionCount` doesn't match the live `Interactions` count". A **manual refresh** sets `LastRefreshRequestedAt = now` and writes a job to the channel — but it **doesn't change the interaction count**, so this `if` is false and the next poll returns `status: "ready"` with the *previous* paragraph still attached.

`ContactDetailPage.loadSummary` then sees `status === 'ready'` and stops polling:

```typescript
if (s.status === 'pending' && attempt < 10) {
  this.pollTimer = setTimeout(() => this.loadSummary(attempt + 1), 1500);
} else {
  this.refreshing.set(false);
}
```

So the user's tap of **Refresh**:

1. POSTs `/api/contacts/:id/summary:refresh` → backend writes the job, returns 202.
2. Frontend calls `loadSummary(0)`.
3. First poll hits the GET endpoint → counts still match → endpoint returns `status: "ready"` with the **old** `paragraph`.
4. Polling stops, `refreshing.set(false)`, spinner clears.
5. (Background) `SummaryWorker` eventually pulls the job and regenerates, updating `row.Paragraph`.
6. Frontend never re-fetches because polling already terminated.

The user sees the spinner spin briefly and the same paragraph as before. There is no way to tell whether the regeneration happened, whether the LLM produced a different result, or whether the click did anything at all. The next time they reload the page they finally see the updated paragraph — disconnected in time from the action.

`SummaryWorker` compounds this with a one-hour idempotency guard (`existing.UpdatedAt > DateTime.UtcNow.AddHours(-1)` ⇒ skip), so refreshes within an hour with no new interactions don't regenerate at all. From the user's seat the refresh button is essentially a no-op.

## Expected

Tapping **Refresh** results in either:

1. The displayed paragraph updating in place once the worker completes (success path), or
2. A clear "stale" / failed signal once polling times out without a fresh paragraph.

Either way, the fact that a refresh is in flight must be observable to the polling SPA. The natural backend signal is `LastRefreshRequestedAt > UpdatedAt` — i.e., the user asked for a refresh more recently than the worker last wrote. While that's true the GET endpoint should report `status: "pending"` so the SPA keeps polling until the worker writes (which bumps `UpdatedAt`) or until the SPA's 15-second budget runs out.

## Actual

GET `/summary` ignores `LastRefreshRequestedAt` entirely. It only compares `InteractionCount`. A manual refresh that doesn't add interactions is invisible to the polling SPA.

## Repro

1. Open a contact whose summary is `status: ready` (paragraph rendered, stats populated).
2. Note the paragraph wording.
3. Tap **Refresh**.
4. Wait 5 seconds. Observe: the paragraph hasn't changed and the spinner is gone.
5. (Optional) Wait for the worker; it does regenerate (provided > 1h since last run, otherwise it skips entirely).
6. Reload the page. *Now* the new paragraph appears — disconnected from the user's click.

## Notes

Radically simple fix in the GET endpoint — gate "ready" on the worker having processed the most recent refresh request:

```csharp
if (row.Paragraph is not null
    && row.InteractionCount == interactionCount
    && (row.LastRefreshRequestedAt is null
        || row.UpdatedAt >= row.LastRefreshRequestedAt))
{
    return Results.Ok(new
    {
        status = "ready",
        paragraph = row.Paragraph,
        sentiment = row.Sentiment,
        interactionCount = row.InteractionCount,
        lastInteractionAt = row.LastInteractionAt,
        updatedAt = row.UpdatedAt,
    });
}

// Otherwise: refresh in flight (or stale) — return pending so the SPA keeps polling.
if (row.Paragraph is not null && row.InteractionCount != interactionCount)
{
    await writer.WriteAsync(new SummaryRefreshJob(id, current.UserId!.Value));
}
return Results.Ok(new { status = "pending" });
```

The frontend's `loadSummary` already preserves the existing `ready` paragraph when polling sees `pending` (via `s.status !== 'pending' || this.summary().status !== 'ready'`), so the visual experience is: paragraph stays, spinner spins, paragraph updates in place when the worker writes. Exactly what flow 27 step 5–7 describes.

The `SummaryWorker.UpdatedAt > -1h ⇒ skip` guard remains as a backstop. If a manual refresh hits the same source-hash within an hour, the worker still skips, but `UpdatedAt` was already > `LastRefreshRequestedAt` going in, so the GET endpoint will return `ready` immediately on the first poll — correct, no spurious "pending".
