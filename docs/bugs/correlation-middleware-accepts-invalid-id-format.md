# Correlation middleware accepts arbitrary X-Correlation-Id values

**Flow:** 37 — Observability: Correlation ID + Structured Logging
**Severity:** Medium-High (log injection risk; deviates from spec)
**Status:** Open

## Symptom

Flow 37 step 2:

> `CorrelationMiddleware` reads the header. **If absent or invalid**
> it generates a new GUID.

`backend/RecallQ.Api/Observability/CorrelationMiddleware.cs`:

```csharp
if (context.Request.Headers.TryGetValue(HeaderName, out var provided)
    && !string.IsNullOrWhiteSpace(provided.ToString()))
{
    id = provided.ToString();        // <— anything non-whitespace is accepted
}
else
{
    id = Guid.NewGuid().ToString("N");
}
```

The middleware only checks "absent or whitespace". A client (or
attacker) can pass `X-Correlation-Id: hello world` or worse, content
with newlines and structured-log fragments
(`"abc\"} severity=ERROR injected={`), and it ends up in the
`CorrelationId` Serilog property and is echoed back in the response
header. That:

- Violates the flow's "if absent or **invalid**" wording — only a
  GUID should be accepted.
- Opens a structured-log injection surface for any caller of a
  public endpoint (e.g., `/api/ping`, `/api/auth/register`).
- Breaks downstream log-aggregation tools that expect the field to
  be a UUID.

## Expected

When `X-Correlation-Id` is provided but not parseable as a `Guid`,
the middleware ignores the value and generates a fresh `Guid`. The
echoed `X-Correlation-Id` response header is always a 32-char hex
GUID.

## Actual

Any non-whitespace string is treated as valid and propagated.

## Repro

1. `curl -H 'X-Correlation-Id: not-a-guid' http://localhost:5151/api/ping -i`.
2. Inspect the response: `X-Correlation-Id: not-a-guid` is echoed
   back. The same string lands in every server log line for that
   request.

## Notes

Radically simple fix: replace the whitespace-only check with
`Guid.TryParse(...)`. On parse success, normalise via
`parsed.ToString("N")`. On parse failure, generate a new GUID. No
other middleware behaviour changes.
