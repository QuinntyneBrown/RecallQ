# SummaryRefreshJob channel is unbounded

**Flow:** 32 — Embedding Pipeline (and summary refresh flow 27)
**Severity:** Medium (memory pressure under bulk writes)
**Status:** Complete — `Program.cs` now registers `Channel.CreateBounded<SummaryRefreshJob>(new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.Wait })`, mirroring the EmbeddingJob channel. Producers backpressure naturally on bulk writes.

## Symptom

The same backpressure pattern that produced the
`embedding-channel-is-unbounded` bug applies to the
`SummaryRefreshJob` channel. `Program.cs`:

```csharp
builder.Services.AddSingleton(Channel.CreateUnbounded<SummaryRefreshJob>());
```

Every interaction create / update / delete enqueues a
`SummaryRefreshJob`. CSV imports and the recently-fixed PATCH
handler each fire one summary-refresh per interaction touched.
Under bulk writes (CSV imports of thousands of interactions, a
backfill that eventually triggers refreshes per contact, the new
PATCH path) the channel can grow unboundedly while the
`SummaryWorker` drains at LLM-API speed (~1 s per call).

The `EmbeddingJob` channel was bounded earlier in this loop
(`Channel.CreateBounded<EmbeddingJob>(1000, Wait)`); the parallel
`SummaryRefreshJob` channel was not.

## Expected

`Channel.CreateBounded<SummaryRefreshJob>(new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.Wait })`.
Producers backpressure naturally instead of growing the heap.

## Actual

`CreateUnbounded`. The channel grows without limit.

## Repro

1. Trigger any large import or bulk PATCH path.
2. Heap usage scales with pending summary jobs.

## Notes

Radically simple fix: replace the `CreateUnbounded` call with the
parallel `CreateBounded(1000, Wait)` form, mirroring the
`EmbeddingJob` registration two lines above.
