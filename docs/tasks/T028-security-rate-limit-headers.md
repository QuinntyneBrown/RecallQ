# T028 — Security: Rate Limits + Headers

| | |
|---|---|
| **Slice** | [22 Security hardening](../detailed-designs/22-security-hardening/README.md) |
| **L2 traces** | L2-055, L2-057 |
| **Prerequisites** | T005, T013, T016, T019 |
| **Produces UI** | No |

## Objective

Register all rate-limit policies (`login`, `search`, `ask`, `summary`, `intro`), attach them to their endpoints via `RequireRateLimiting`, and add the security-headers middleware (HSTS, CSP, nosniff, Referrer-Policy).

## Scope

**In:**
- `RateLimitPolicies.cs` central registration.
- `SecurityHeadersMiddleware` returning the headers per L2-057.
- CSP: `default-src 'self'; connect-src 'self' https://api.openai.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'`.

**Out:**
- WAF / CDN config.

## ATDD workflow

1. **Red**:
   - `Login_6th_in_60s_returns_429` (L2-055).
   - `Search_61st_returns_429` (L2-055).
   - `Ask_21st_returns_429` (L2-055).
   - `Summary_2nd_in_60s_returns_429` (L2-032).
   - `Intro_21st_returns_429` (L2-055).
   - `Hsts_and_csp_present_on_every_response` (L2-057).
2. **Green** — register + attach.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] All policies live in one file. No duplicated windowed-limiter code inside endpoints.
- [ ] The headers middleware is registered exactly once, early in the pipeline.
- [ ] CSP does not include `unsafe-eval`.

## Screenshot

Not applicable.

## Definition of Done

- [x] 6 tests pass.
- [x] `curl -I https://localhost:5001/api/ping` shows all headers.
- [x] Three verification passes complete clean.

**Status: Complete**
