# Metrics `endpoint` label uses raw request path on unmatched routes — unbounded cardinality

**Flow:** 38 — Metrics Scrape (/metrics)
**Severity:** Medium-High (a sustained 404 pattern — a scanner, a typo'd GUID re-tried by a buggy client, a noisy bot — leaks unique label values into `recallq_http_requests_total` and `recallq_api_latency_seconds`; Prometheus' time-series count grows without bound; long-running deployments pay memory + storage cost forever)
**Status:** Complete — `ApiLatencyMiddleware`'s endpoint-label fallback no longer reads `context.Request.Path.Value`; it now collapses every unmatched route to the constant `"unmatched"`. Matched routes still report `RouteEndpoint.RoutePattern.RawText`, which is bounded by the registered routes. New acceptance test `MetricsCardinalityTests` hits three distinct unmatched paths and asserts the `endpoint` label space stays small (≤ 2) and that the literal request paths never appear in `/metrics`.

## Symptom

`backend/RecallQ.Api/Observability/ApiLatencyMiddleware.cs`:

```csharp
finally
{
    sw.Stop();
    var endpoint = context.GetEndpoint()?.Metadata
        .GetMetadata<Microsoft.AspNetCore.Routing.RouteNameMetadata>()?.RouteName;
    if (string.IsNullOrEmpty(endpoint))
    {
        var routePattern = (context.GetEndpoint() as Microsoft.AspNetCore.Routing.RouteEndpoint)?.RoutePattern?.RawText;
        endpoint = routePattern ?? context.Request.Path.Value ?? "unknown";
    }
    var status = context.Response.StatusCode.ToString();
    RecallQMetrics.ApiLatencySeconds.WithLabels(endpoint, status).Observe(sw.Elapsed.TotalSeconds);
    RecallQMetrics.HttpRequestsTotal.WithLabels(endpoint, status).Inc();
}
```

For any request that **doesn't match a registered route** (`context.GetEndpoint()` is `null`), both branches fall through to `context.Request.Path.Value`. That's the literal request path — `/api/contacts/d6c7f8a9-…/foo` from a scanner probing for SSRF, `/wp-admin`, `/.env`, every typo'd GUID a buggy retry loop produces, and so on.

Each unique path creates a new combination of `(endpoint, status_code)` labels in:

- `recallq_http_requests_total{endpoint, status_code}` (counter)
- `recallq_api_latency_seconds{endpoint, status}` (histogram)

Prometheus stores one time series per label combination. The flow doc explicitly calls this out:

> **PII labels** — never label a metric with raw query text, contact names, or content. Only endpoint names, status codes, and model identifiers.

A path containing a contact GUID *is* effectively raw data for cardinality purposes — there's no upper bound. Every histogram bucket multiplies the cardinality. Over a few hours of bot traffic the registry can grow to tens of thousands of series, slowing scrapes and exhausting Prometheus memory.

## Expected

Unmatched requests collapse to a small, fixed set of labels — e.g., the literal string `"unmatched"`. Matched requests continue to use the route pattern (`/api/contacts/{id:guid}`) which is naturally bounded by the number of registered endpoints.

Concretely:

```csharp
var endpoint = context.GetEndpoint()?.Metadata
    .GetMetadata<RouteNameMetadata>()?.RouteName;
if (string.IsNullOrEmpty(endpoint))
{
    endpoint = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern?.RawText
               ?? "unmatched";
}
```

The fallback string is constant; `recallq_http_requests_total{endpoint="unmatched", status_code="404"}` is one series no matter how many distinct invalid paths the API receives.

## Actual

Every distinct unmatched path adds a new time series. A trivial probe `for i in {1..1000}; do curl https://api/api/contacts/$(uuidgen); done` against a non-existent route prefix produces 1000 distinct series in the registry.

## Repro

1. Start the API.
2. Hit the metrics endpoint and grep for the counter — base cardinality.
3. Issue several requests to **distinct unmatched** paths:

   ```
   curl http://localhost:5151/some-bogus/path-1
   curl http://localhost:5151/some-bogus/path-2
   curl http://localhost:5151/some-bogus/path-3
   ```

4. Re-scrape `/metrics`. Observe three new lines under `recallq_http_requests_total`, each with a different `endpoint=` label, and three new histogram series under `recallq_api_latency_seconds`.

For matched routes (`/api/ping`, `/api/contacts/{id:guid}`) the cardinality stays constant — one series per known route.

## Notes

Radically simple fix — replace the `?? context.Request.Path.Value` fallback with a constant string. The middleware's own structured log already records the actual path, so observability for the unmatched path itself isn't lost — just kept out of metric labels:

```csharp
endpoint = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern?.RawText
           ?? "unmatched";
```

A regression test asserts that hitting two distinct unmatched paths produces only **one** new `endpoint="unmatched"` series in the registry, not two. The existing observability tests already grep `/metrics` for canonical label shapes; add one targeted assertion alongside.
