# Summary refresh rate limit keys by user only, not (user, contact)

**Flow:** 35 — Rate Limiting (with summary refresh flow 27)
**Severity:** Medium-High (refreshing contact A blocks contact B for 60s)
**Status:** Complete — `RateLimitPolicies` "summary" policy now reads `httpCtx.Request.RouteValues["id"]` and partitions by `${userId}:{contactId}`. Refreshing contact A no longer consumes the bucket for contact B.

## Symptom

Flow 35's bucket table:

| Endpoint                                    | Limit                          |
| ------------------------------------------- | ------------------------------ |
| `POST /api/contacts/{id}/summary:refresh`   | **1 / 60 s per (user, contact)** |

`backend/RecallQ.Api/Security/RateLimitPolicies.cs`:

```csharp
options.AddPolicy("summary", httpCtx =>
{
    var key = httpCtx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = 1,
        Window = TimeSpan.FromSeconds(60),
        …
    });
});
```

The partition key is just the user id. So a user who refreshes
contact A's summary cannot refresh contact B's summary for 60s
either. The flow's intent is one-refresh-per-contact-per-minute,
not one-refresh-anywhere-per-minute. Multi-contact triage workflows
are blocked.

## Expected

The partition key combines user id and contact id, e.g.,
`{userId}:{contactId}`. Refreshing contact A doesn't affect the
bucket for contact B.

## Actual

Single user-id partition; the first refresh consumes the bucket for
all of the user's contacts.

## Repro

1. Sign in.
2. Create contacts A and B.
3. `POST /api/contacts/A/summary:refresh` → 202.
4. `POST /api/contacts/B/summary:refresh` (within 60s) → 429
   (should be 202 — different contact).

## Notes

Radically simple fix: add a contact id component to the partition
key by reading `httpCtx.Request.RouteValues["id"]?.ToString()`
(populated after routing, before the rate limiter runs because
`.RequireRateLimiting("summary")` attaches per-endpoint).
