# recallq_embedding_latency_seconds histogram missing model label

**Flow:** 38 — Metrics Scrape (/metrics)
**Severity:** Low-Medium (operational visibility)
**Status:** Complete — `RecallQMetrics.EmbeddingLatencySeconds` now declares `LabelNames = new[] { "model" }`. `EmbeddingWorker.ProcessAsync` calls `EmbeddingLatencySeconds.WithLabels(_client.Model).NewTimer()` so every observation is attributed to the embedding model that produced it.

## Symptom

Flow 38's metrics table:

| Name                                | Type      | Labels |
| ----------------------------------- | --------- | ------ |
| `recallq_embedding_latency_seconds` | histogram | `model` |

`backend/RecallQ.Api/Observability/RecallQMetrics.cs`:

```csharp
public static readonly Histogram EmbeddingLatencySeconds = Metrics.CreateHistogram(
    "recallq_embedding_latency_seconds",
    "Embedding latency");
```

No labels. `EmbeddingWorker.ProcessAsync` measures latency without
attributing it to a model:

```csharp
using var _timer = RecallQMetrics.EmbeddingLatencySeconds.NewTimer();
```

So during a model upgrade, when both the old and new model are
producing embeddings, an operator can't compare their latency
distributions. Provider regressions ("the new model is 2× slower")
are invisible.

## Expected

`recallq_embedding_latency_seconds` declares a `model` label, and
`EmbeddingWorker` passes `_client.Model` when measuring:

```csharp
using var _timer = RecallQMetrics.EmbeddingLatencySeconds
    .WithLabels(_client.Model).NewTimer();
```

## Actual

No labels declared, no labels passed.

## Repro

1. `curl http://localhost:5151/metrics | grep recallq_embedding_latency_seconds_bucket`.
2. Observe lines like
   `recallq_embedding_latency_seconds_bucket{le="…"} N` — no
   `model` dimension.

## Notes

Radically simple fix:

- Add `new HistogramConfiguration { LabelNames = new[] { "model" } }`
  to the `Metrics.CreateHistogram` call.
- In `EmbeddingWorker.ProcessAsync`, call
  `EmbeddingLatencySeconds.WithLabels(_client.Model).NewTimer()`
  instead of `.NewTimer()`.
