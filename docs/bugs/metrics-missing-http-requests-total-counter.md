# Metrics missing recallq_http_requests_total counter

**Flow:** 38 — Metrics Scrape (/metrics)
**Severity:** High (alerting rule unimplementable)
**Status:** Open

## Symptom

Flow 38 lists the metrics the API must emit:

| Name                          | Type    | Labels                          |
| ----------------------------- | ------- | ------------------------------- |
| …                             | …       | …                               |
| `recallq_http_requests_total` | counter | `endpoint`, `status_code`       |

…and gives an explicit alerting example that depends on it:

```
sum(rate(recallq_http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(recallq_http_requests_total[5m]))
```

But `RecallQMetrics.cs` defines only `ApiLatencySeconds`,
`EmbeddingLatencySeconds`, `SearchLatencySeconds`, `LlmTokensTotal`,
and `LlmCostUsd`. There is no `HttpRequestsTotal`. Any Prometheus
deployment that imports the recommended alert rules from the
spec gets a `vector cannot contain metrics with the same labelset`
or empty-vector failure — sustained 5xx alerts never fire because
the underlying counter doesn't exist.

## Expected

A counter `recallq_http_requests_total{endpoint, status_code}`
incremented once per HTTP response, available in `/metrics` so
alerting rules can compute error rates.

## Actual

`RecallQMetrics` doesn't declare the counter; nothing increments
it; `/metrics` doesn't expose it.

## Repro

1. `curl http://localhost:5151/api/ping`.
2. `curl http://localhost:5151/metrics`.
3. `grep recallq_http_requests_total` → no matches.

## Notes

Radically simple fix:

- Add `HttpRequestsTotal = Metrics.CreateCounter("recallq_http_requests_total", "HTTP requests", labels: ["endpoint", "status_code"])` to `RecallQMetrics`.
- In `ApiLatencyMiddleware.InvokeAsync`'s `finally`, increment
  `HttpRequestsTotal.WithLabels(endpoint, response.StatusCode.ToString()).Inc()`
  alongside the latency observation.
- Existing test for `/metrics` already greps for metric names — add
  one more assertion for `recallq_http_requests_total` to lock the
  contract.
