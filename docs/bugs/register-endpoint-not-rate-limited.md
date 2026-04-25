# /api/auth/register has no rate limit

**Flow:** 35 — Rate Limiting (with auth flow 01)
**Severity:** High (registration flood / abuse)
**Status:** Open

## Symptom

Flow 35's bucket table:

| Endpoint                  | Limit             |
| ------------------------- | ----------------- |
| `POST /api/auth/register` | 5 / 60 s per IP   |

`backend/RecallQ.Api/Endpoints/AuthEndpoints.cs`:

```csharp
app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db, Argon2Hasher hasher) =>
{
    …
    return Results.Created(…);
});

app.MapPost("/api/auth/login", …).RequireRateLimiting(LoginRateLimit.PolicyName);
```

The login endpoint is gated; register is **not**. A malicious or
buggy client can post unlimited registration attempts from the same
IP, flooding the `users` table with fake accounts (each one
triggering an Argon2 hash, which is intentionally expensive — the
combination of unbounded registration + per-attempt CPU cost is a
classic DoS vector). Per Flow 35 this should be 5/60s per IP.

`RateLimitPolicies` has no `register` policy declared either, so
the bug is two-layered: missing policy + missing endpoint
attachment.

## Expected

- A `register` policy in `AddRecallQRateLimits` keyed by IP, with
  `PermitLimit = 5` and `Window = 60s`.
- `MapPost("/api/auth/register", …).RequireRateLimiting("register")`.
- Over-limit responses use the existing `OnRejected` callback so
  they ship the `Retry-After` header and JSON body.

## Actual

No policy, no `.RequireRateLimiting` on the register endpoint.

## Repro

1. POST `/api/auth/register` six times with distinct emails from
   the same IP within 60s.
2. Observe: all six succeed (or fail with `email_taken` /
   `invalid_email`, never `429`).

## Notes

Radically simple fix:

- Add a `register` policy to `RateLimitPolicies.AddRecallQRateLimits`,
  keyed by `httpCtx.Connection.RemoteIpAddress?.ToString() ??
  "unknown"`, `PermitLimit = 5`, `Window = TimeSpan.FromSeconds(60)`.
- Tag the register endpoint with `.RequireRateLimiting("register")`.
- The existing `OnRejected` callback handles the 429 response shape
  uniformly with the other policies.
