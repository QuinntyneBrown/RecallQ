# T030 — Observability

| | |
|---|---|
| **Slice** | [23 Observability](../detailed-designs/23-observability/README.md) |
| **L2 traces** | L2-069, L2-070, L2-071 |
| **Prerequisites** | T013, T016 (LLM metrics), T019 |
| **Produces UI** | No |

## Objective

Wire Serilog JSON logging with correlation IDs, expose `/metrics` in Prometheus format, and enforce the PII-scrubbing guard.

## Scope

**In:**
- Serilog + `Compact` JSON formatter + enrichers.
- `CorrelationMiddleware` assigning a GUID, pushing into `LogContext`, echoing as `X-Correlation-Id`.
- `prometheus-net.AspNetCore` middleware exposing `/metrics`.
- Custom instruments: `recallq_api_latency_seconds`, `recallq_embedding_latency_seconds`, `recallq_search_latency_seconds`, `recallq_llm_tokens_total{direction}`, `recallq_llm_cost_usd`.
- PII-scrub test sink.

**Out:**
- OpenTelemetry exporter (later).

## ATDD workflow

1. **Red**:
   - `Correlation_id_present_on_every_log_entry` (L2-069).
   - `Correlation_id_echoed_in_response_header` (L2-069).
   - `Metrics_endpoint_exposes_labeled_histograms` (L2-070).
   - `Llm_tokens_counter_increments_on_ask_request` (L2-070).
   - `Logs_never_contain_q_content_email_or_phone` (L2-071).
2. **Green** — implement middleware + instruments + sink test.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Only one logging configuration file; no per-endpoint logger customization.
- [ ] `/metrics` is unauthenticated (scraper-friendly) and limited to internal deployment network in production.

## Screenshot

Not applicable.

## Definition of Done

- [x] 5 tests pass.
- [x] `curl /metrics` returns a well-formed Prometheus exposition.
- [x] Three verification passes complete clean.

**Status: Complete**
