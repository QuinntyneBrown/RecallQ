# T005 — Register + Login API

| | |
|---|---|
| **Slice** | [02 User authentication](../detailed-designs/02-user-authentication/README.md) |
| **L2 traces** | L2-001, L2-002, L2-052, L2-055 |
| **Prerequisites** | T001, T004 |
| **Produces UI** | No |

## Objective

Ship `/api/auth/register`, `/api/auth/login`, `/api/auth/me` and a global rate-limit policy `login` (5 per 60s per email+IP). Argon2id hashing. HttpOnly SameSite=Strict cookie on login.

## Scope

**In:**
- `Endpoints/AuthEndpoints.cs`.
- `User` entity + migration (adds `users` table).
- `Argon2Hasher` wrapper over `Konscious.Security.Cryptography.Argon2`.
- Rate-limiter policy registration for `login` and attachment to the login endpoint.
- `ICurrentUser` scoped service.

**Out:**
- Logout + revocation (T006).
- Any UI (T006).
- Password reset, verification, MFA.

## ATDD workflow

1. **Red — tests**:
   - `Register_creates_user_returns_201` (L2-001).
   - `Register_duplicate_email_returns_409` (L2-001).
   - `Register_weak_password_returns_400` (L2-001).
   - `Login_valid_credentials_sets_cookie_and_returns_200` (L2-002).
   - `Login_wrong_password_returns_401_generic` (L2-002).
   - `Login_unknown_email_returns_same_401` (L2-002).
   - `Sixth_login_per_email_ip_in_60s_returns_429` (L2-002, L2-055).
   - `Password_hash_is_argon2id_not_plain` (L2-052) — queries the DB and inspects prefix `$argon2id$`.
2. **Red** — run, all fail.
3. **Green** — implement endpoints, hasher, rate limit, `ICurrentUser`.
4. **Green** — all pass.

## Playwright POM

N/A — backend task. UI-level e2e arrives in T006.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `AuthEndpoints.cs` is under 120 lines.
- [ ] No `IAuthService` abstraction exists; endpoints call `DbContext` and `Argon2Hasher` directly.
- [ ] Login error bodies are identical whether the email exists or not (bytewise equal).

## Screenshot

Not applicable — no UI.

## Definition of Done

- [ ] All 8 acceptance tests pass.
- [ ] `curl -c jar.txt -d '{"email":"a@b.c","password":"correcthorsebattery"}' -H 'Content-Type: application/json' /api/auth/register` then `/api/auth/login` issues a cookie.
- [ ] Running the failing-login test 6 times returns 429 on the 6th.
- [ ] Three verification passes complete clean.
