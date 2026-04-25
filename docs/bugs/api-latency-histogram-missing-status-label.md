# recallq_api_latency_seconds histogram missing status label

**Flow:** 38 — Metrics Scrape (/metrics)
**Severity:** Medium (alerting / triage gap)
**Status:** Complete — `RecallQMetrics.ApiLatencySeconds` now declares `LabelNames = new[] { "endpoint", "status" }`. `ApiLatencyMiddleware` resolves the status string once and passes it to both `ApiLatencySeconds.WithLabels(endpoint, status)` and the existing `HttpRequestsTotal.WithLabels(endpoint, status)` increment, keeping the labels consistent across the two metrics.

## Symptom

Flow 38's metrics table:

| Name                          | Type      | Labels             |
| ----------------------------- | --------- | ------------------ |
| `recallq_api_latency_seconds` | histogram | `endpoint, status` |

`backend/RecallQ.Api/Observability/RecallQMetrics.cs`:

```csharp
public static readonly Histogram ApiLatencySeconds = Metrics.CreateHistogram(
    "recallq_api_latency_seconds",
    "API latency",
    new HistogramConfiguration { LabelNames = new[] { "endpoint" } });
```

Only `endpoint` is declared as a label. `ApiLatencyMiddleware`
mirrors this:

```csharp
RecallQMetrics.ApiLatencySeconds.WithLabels(endpoint).Observe(sw.Elapsed.TotalSeconds);
```

So an operator can't separate happy-path 200 latency from 5xx
latency on the same endpoint, can't graph "p95 latency for
4xx-only", and can't write the "5xx-only p95 alert" rule that
flows naturally from the existing `recallq_http_requests_total`
counter (which *does* carry `status_code`).

## Expected

`recallq_api_latency_seconds` carries both `endpoint` and `status`
labels, populated from the resolved endpoint string and the
final HTTP status code per request.

## Actual

`endpoint` only.

## Repro

1. `curl http://localhost:5151/api/ping`.
2. `curl http://localhost:5151/metrics | grep recallq_api_latency_seconds_bucket`.
3. Observe lines like
   `recallq_api_latency_seconds_bucket{endpoint="…",le="…"} N` —
   no `status` label appears.

## Notes

Radically simple fix:

- Add `"status"` to the `LabelNames` array on `ApiLatencySeconds`.
- Update `ApiLatencyMiddleware` to call
  `WithLabels(endpoint, context.Response.StatusCode.ToString())`,
  matching the existing `HttpRequestsTotal` increment.
