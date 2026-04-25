# Login timing side-channel reveals whether an email is registered

**Flow:** 02 — User Login
**Severity:** Medium (the generic-message protection is defeated by a timing oracle: roughly two orders of magnitude difference between the unknown-email path and the wrong-password path; rate limiting at 5/min per (ip, email) limits per-target probing but not per-distinct-email enumeration from a botnet)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/AuthEndpoints.cs`:

```csharp
app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, Argon2Hasher hasher, HttpContext http) =>
{
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var password = req.Password ?? "";
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user is null || !hasher.Verify(password, user.PasswordHash))
    {
        http.Response.StatusCode = 401;
        http.Response.ContentType = "application/json";
        await http.Response.Body.WriteAsync(InvalidCredentialsBody);
        return;
    }
    …
});
```

When `user is null`, C# short-circuit evaluation skips `hasher.Verify(...)` entirely. When the user exists, `Argon2Hasher.Verify` runs the full Argon2id KDF (`MemorySize = 19456 KB`, `Iterations = 2`, `DegreeOfParallelism = 2`) — measured at ~100ms on commodity hardware.

So:

- **Unknown email** path: just the EF query → response in ~5ms.
- **Known email, wrong password** path: EF query + Argon2 verify → response in ~100ms.

An attacker with a list of email addresses can probe each one via `POST /api/auth/login` and measure response time. Fast responses identify non-existent accounts; slow responses identify registered ones — without ever needing the password to verify.

The flow's contract assumes content-based parity (same generic JSON body for both paths) is enough to prevent enumeration:

> **Wrong password / unknown email** → `401 Unauthorized` with the same generic body in both cases (no existence leak).

But timing is a side channel that defeats that protection. The login rate limiter (5/min per `(ip, email)`) caps how fast an attacker can probe a *single* email, but it doesn't help against enumeration: each new email is a fresh bucket, so an attacker can hit 5/min per email × M distinct emails = 5M total attempts/min from one IP. Distributed across a botnet, the throughput is unbounded.

## Expected

The two failure paths take indistinguishable wall-clock time. The standard mitigation: when the user lookup misses, still run a dummy Argon2 verify so the request takes the same ~100ms. The dummy hash is precomputed (any constant Argon2id-formatted hash works; the verify will fail) and never matches a real password.

```csharp
var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
var passwordOk = user is null
    ? hasher.Verify(password, Argon2Hasher.DummyHash)  // returns false, but takes the same time
    : hasher.Verify(password, user.PasswordHash);
if (user is null || !passwordOk)
{
    // 401 with the generic body
    …
}
```

The dummy verify call's return value is discarded for the unknown-email path; only the timing matters. The user-not-found case still returns 401, just with the same latency as wrong-password.

## Actual

`user is null` short-circuits past `Verify`. The unknown-email response is ~20× faster than the wrong-password response.

## Repro

1. POST `/api/auth/login` with a registered email + wrong password. Note the response time (e.g., 100ms).
2. POST `/api/auth/login` with a clearly unregistered email + any password. Note the response time (e.g., 5ms).
3. The 20× ratio is reproducible across runs because Argon2's KDF parameters are fixed at startup. An attacker scripts this: any email producing a "fast 401" is unregistered; any "slow 401" is a hit.

## Notes

Radically simple fix:

1. Add a public `DummyHash` constant (or static field) on `Argon2Hasher` — a real Argon2id-formatted string the class can verify against safely. One way: at static-init time, hash a fixed throwaway password (`"___never_match___"`) once and cache the result; subsequent verifies against any user-supplied password will run the full KDF and return false.
2. In the login handler, when `user is null`, call `hasher.Verify(password, Argon2Hasher.DummyHash)` and discard the result. Then take the `user is null || !passwordOk` branch as before.

The change touches only `AuthEndpoints.cs` and `Argon2Hasher.cs`. The rate limiter, claims, and cookie issuance paths are unchanged. The 401 body is unchanged.

A regression test could measure the wall-clock time of the two failure paths against the same factory and assert they're within an order of magnitude — but timing assertions are flaky in CI; a stronger test asserts that `hasher.Verify` is invoked exactly once per request regardless of whether the user exists. (The current implementation invokes it zero or one times.)
