# Rate-limit 429 lacks Retry-After header and JSON body

**Flow:** 35 — Rate Limiting (429 Response)
**Severity:** Medium-High (clients can't back off correctly)
**Status:** Complete — `RateLimitPolicies.AddRecallQRateLimits` now sets `options.OnRejected` to a callback that reads `MetadataName.RetryAfter` from the lease (falling back to 60 s when the FixedWindow limiter doesn't surface it), writes the integer to the `Retry-After` header, and serializes a `{ error: "rate_limited", retryAfter: N }` JSON body to the response stream.

## Symptom

Flow 35 step 5:

> **Over limit** → short-circuit with `429 Too Many Requests`,
> `Retry-After: <seconds>` header, and a small body
> `{ "error": "rate_limited", "retryAfter": N }`. No endpoint code
> runs.

`backend/RecallQ.Api/Security/RateLimitPolicies.cs` configures
ASP.NET's rate limiter with only `RejectionStatusCode = 429`:

```csharp
services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("login",  …);
    options.AddPolicy("search", …);
    …
});
```

There is no `OnRejected` callback, so the framework's default
behaviour applies: status `429` with an empty body and **no
Retry-After header**. The flow's contract — and any reasonable
client back-off strategy — needs both.

Concretely:

- Browser-side `installApiInterceptor` and the per-page error
  handlers (e.g., `AskService` `'Too many questions — try again in
  a minute.'`) are forced to hard-code "60 seconds" because the
  server doesn't tell them when to retry.
- Native HTTP clients (curl, Postman) and SDKs that auto-retry on
  429 won't see a Retry-After hint and will retry immediately.

## Expected

Every 429 response from a rate-limited endpoint:

- Has a `Retry-After` header (seconds, integer).
- Has a JSON body `{ "error": "rate_limited", "retryAfter": N }`
  where `N` matches the header.

## Actual

429 with no Retry-After header and an empty body.

## Repro

1. POST `/api/auth/login` six times within 60 s with the same email
   from the same IP (5 valid + 1 over).
2. Inspect the 6th response: status 429, no `Retry-After`, body
   empty.

## Notes

Radically simple fix: add an `options.OnRejected` callback in
`AddRecallQRateLimits` that:

- Reads `lease.TryGetMetadata(MetadataName.RetryAfter, out var ts)`.
  Falls back to 60 s when metadata is absent (FixedWindow doesn't
  always populate it — the policy windows are 60 s anyway).
- Sets `httpContext.Response.Headers.RetryAfter = seconds`.
- Writes `{ error = "rate_limited", retryAfter = seconds }` as
  JSON.
