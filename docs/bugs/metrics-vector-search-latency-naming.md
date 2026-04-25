# Search latency metric has inconsistent name

**Status:** Open
**Source:** Flow 38 - Metrics Scrape E2E tests
**Severity:** Medium (metric name does not match spec)

## Symptom

The search latency histogram is named `recallq_search_latency_seconds` in the code, but flow 38 specification requires it to be named `recallq_vector_search_latency_seconds`.

## Expected

Per flow 38, the metrics endpoint should expose:
```
recallq_vector_search_latency_seconds - histogram measuring vector search latency
```

## Actual

`backend/RecallQ.Api/Observability/RecallQMetrics.cs` defines:
```csharp
public static readonly Histogram SearchLatencySeconds = Metrics.CreateHistogram(
    "recallq_search_latency_seconds",  // ← should be "recallq_vector_search_latency_seconds"
    "Search latency");
```

## Repro

1. Start the API
2. Perform a search operation
3. GET `/metrics`
4. Observe `recallq_search_latency_seconds` instead of `recallq_vector_search_latency_seconds`

## Notes

Radically simple fix:
- Rename the metric from `recallq_search_latency_seconds` to `recallq_vector_search_latency_seconds`
- No other changes needed; the metric is already being used in SearchEndpoints.cs line 32
