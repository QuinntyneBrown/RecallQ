# Summary poll interval is 3 s instead of flow-26's 1.5 s

**Flow:** 26 — View Relationship Summary
**Severity:** Medium (slower-than-spec UI)
**Status:** Complete — `ContactDetailPage.loadSummary` now schedules its self-recursion with `setTimeout(..., 1500)`, halving the cadence to match flow 26's 1.5 s spec; max attempts stays at 10 so total polling is now ≤ 15 s.

## Symptom

Flow 26 step 6:

> The SPA shows the summary (possibly flagged `stale`) and, if the
> card is empty/stale, polls `/summary` **every 1.5 s (max 15 s)**.

`ContactDetailPage.loadSummary` polls every 3 000 ms up to 10
attempts, for a total of 30 s of polling rather than the 15 s the
flow specifies:

```ts
if (s.status === 'pending' && attempt < 10) {
  this.pollTimer = setTimeout(() => this.loadSummary(attempt + 1), 3000);
}
```

So when a user opens a contact whose summary is being regenerated,
the card sits on `Generating summary…` for ~3 s before the next
check, instead of refreshing every 1.5 s. Worst case a user waits
twice as long to see the AI paragraph appear, and the SPA spends
twice the wall-clock window polling the API.

## Expected

- Poll interval: 1 500 ms.
- Max attempts: 10 (so total ≤ 15 s, matching the flow's "max 15 s").

## Actual

- Poll interval: 3 000 ms.
- Max attempts: 10.
- Total: 30 s.

## Repro

1. Mock `GET /api/contacts/:id/summary` to always return
   `{ status: 'pending' }`.
2. Open `/contacts/:id`.
3. Count the number of `/summary` requests in the first ~4 s.
4. Observe: only 2 requests (initial + one ~3 s later) instead of
   the 3 expected at 1.5 s cadence (initial + ~1.5 s + ~3 s).

## Notes

Radically simple fix: change the `setTimeout` delay in
`ContactDetailPage.loadSummary` from `3000` to `1500`.
