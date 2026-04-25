# 42 — Remember Me

## Summary

When a user logs in with "Remember me" enabled, the system issues a long-lived refresh token stored in an HttpOnly cookie with an extended expiration. This allows users to maintain automatic login across browser sessions without requiring password re-entry. The refresh token can be revoked per-device or globally.

**Traces to:** L1-001, L1-013, L2-002, L2-003.

## Actors

- **User** — someone logging in.
- **Angular SPA** (`LoginPage`).
- **AuthEndpoints** — `POST /api/auth/login`.
- **Argon2Hasher** — password verifier.
- **AppDbContext** / `users` and `refresh_tokens` tables.
- **Rate limiter** — per-IP + per-email login attempt bucket.

## Trigger

User submits the login form with `email`, `password`, and the "Remember me" checkbox enabled.

## Flow

1. User enters email, password, and checks **Remember me**, then taps **Sign in**.
2. The SPA POSTs to `/api/auth/login` with `{ email, password, rememberMe: true }`.
3. The rate limiter checks the `(email, IP)` bucket for ≤ 5 attempts per minute.
4. The endpoint loads the user row by email and verifies the password with `Argon2Hasher.Verify()`.
5. On success, the endpoint issues a short-lived access token (JWT or session cookie, 15 min TTL).
6. If `rememberMe` is true, a long-lived refresh token is generated (e.g., 30 days) and stored:
   - In the database table `refresh_tokens` with user ID, token hash, device fingerprint, and expiry.
   - In a `Set-Cookie: rq_refresh=…; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000` (30 days).
7. The SPA navigates to `/home`.
8. When the access token expires, the SPA automatically calls `POST /api/auth/refresh` with the refresh token.
9. The server validates the refresh token against the database, checks the device fingerprint, and issues a new access token.
10. If the refresh token is revoked or invalid, the user is redirected to login.

## Alternatives and errors

- **Remember me disabled** → Only a short-lived access token is issued; no refresh token cookie is set.
- **Wrong password / unknown email** → `401 Unauthorized` with generic message (same as standard login).
- **Refresh token expired or revoked** → `401 Unauthorized`; SPA redirects to login.
- **Device fingerprint mismatch** → `401 Unauthorized` to prevent token replay from different devices.
- **> 5 failed login attempts in 60 s** → `429 Too Many Requests` with `Retry-After`.
- **Global logout** → All refresh tokens for the user are revoked; subsequent refresh attempts fail.

## Sequence diagram

![Remember me sequence](42-remember-me.png)
