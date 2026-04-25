# recallq_llm_tokens_total counter missing endpoint label

**Flow:** 38 — Metrics Scrape (/metrics)
**Severity:** Low-Medium (cost attribution gap)
**Status:** Open

## Symptom

Flow 38's metrics table:

| Name                       | Type    | Labels                          |
| -------------------------- | ------- | ------------------------------- |
| `recallq_llm_tokens_total` | counter | `endpoint, direction (in/out)`  |

`backend/RecallQ.Api/Observability/RecallQMetrics.cs`:

```csharp
public static readonly Counter LlmTokensTotal = Metrics.CreateCounter(
    "recallq_llm_tokens_total",
    "LLM tokens",
    new CounterConfiguration { LabelNames = new[] { "direction" } });
```

Only `direction` is declared. The two call sites both live in
`AskEndpoints`, but the counter doesn't carry the endpoint that
produced the tokens, so cost attribution by feature is impossible.
When future endpoints (intro drafts, summary worker, etc.) start
calling `IChatClient` they'll all dump tokens into the same
unattributed bucket.

## Expected

`recallq_llm_tokens_total` declares `endpoint` and `direction`
labels. Existing call sites in `AskEndpoints` pass `"ask"` as the
endpoint; future call sites pass their own value.

## Actual

Only `direction`; the endpoint that produced the tokens is lost.

## Repro

1. POST any question to `/api/ask`.
2. `curl http://localhost:5151/metrics | grep recallq_llm_tokens_total`.
3. Observe lines like `recallq_llm_tokens_total{direction="in"} N` —
   no `endpoint` dimension.

## Notes

Radically simple fix:

- Add `"endpoint"` to the `LabelNames` array on `LlmTokensTotal`.
- Update the two call sites in `AskEndpoints.cs` to call
  `WithLabels(endpoint, direction)` with `endpoint = "ask"`.
- Future call sites (intro drafts, summary worker) follow the same
  pattern with their own endpoint label.
