# Embedding job channel is unbounded; flow 32 specifies bounded

**Flow:** 32 — Embedding Pipeline
**Severity:** Medium-High (memory pressure under bulk writes)
**Status:** Open

## Symptom

Flow 32 actors line:

> **Channel<EmbeddingJob>** — bounded in-process queue.

`backend/RecallQ.Api/Program.cs`:

```csharp
builder.Services.AddSingleton(Channel.CreateUnbounded<EmbeddingJob>());
```

The channel is registered with no upper bound. Producers
(`POST /api/contacts`, `POST /api/contacts/{id}/interactions`,
`POST /api/import/contacts`, the new contact PATCH wired up in this
loop) all enqueue jobs synchronously. Under bulk writes — a CSV
import of 5 000 contacts, an embedding-model upgrade backfill — all
the jobs accumulate in process memory before the
`EmbeddingWorker` can drain them. There is no backpressure on the
producer, no upper bound on memory consumption.

This contradicts both the flow's wording and the alternatives line
"Worker crash → on restart, the channel is empty (in-memory)"
which only makes sense if the channel is sized predictably.

## Expected

`Channel.CreateBounded<EmbeddingJob>(new BoundedChannelOptions(N)
{ FullMode = BoundedChannelFullMode.Wait })` so:

- Memory usage is capped at N pending jobs.
- Bursty producers backpressure (await yields) instead of growing
  the heap.
- Workers drain at a steady rate without memory thrash.

A capacity around 1 000 is a sensible default — large enough to
absorb a normal CSV import without producer blocking, small enough
to bound RAM at single-digit MB.

## Actual

`CreateUnbounded`. The channel grows for as long as producers feed
faster than the worker consumes.

## Repro

1. Trigger any backfill or large import.
2. Observe heap growth proportional to the number of pending jobs.

## Notes

Radically simple fix: replace `Channel.CreateUnbounded<EmbeddingJob>()`
with `Channel.CreateBounded<EmbeddingJob>(new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.Wait })`.
The same pattern can later apply to the SummaryRefreshJob channel
but is out of scope here.
