# 43 — Reset Password

## Summary

A user who has forgotten their password can request a password reset. The system generates a time-limited reset token, sends it via email, and allows the user to set a new password when they verify the token. Reset tokens are single-use and expire after a short window (e.g., 24 hours). All existing sessions are invalidated when a password is reset.

**Traces to:** L1-001, L1-014, L2-004, L2-005.

## Actors

- **User** — someone who forgot their password.
- **Angular SPA** (`ForgotPasswordPage`, `ResetPasswordPage`).
- **AuthEndpoints** — `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- **EmailService** — SMTP or email provider.
- **Argon2Hasher** — password hasher.
- **AppDbContext** / `users`, `password_resets`, and `refresh_tokens` tables.
- **Rate limiter** — per-email password reset request bucket.

## Trigger

User taps **Forgot password?** on the login page and enters their email address.

## Flow — Request Reset

1. User navigates to the forgot password page and enters their email.
2. The SPA POSTs to `POST /api/auth/forgot-password` with `{ email }`.
3. The rate limiter checks the per-email bucket for ≤ 3 requests per hour.
4. The endpoint queries the database for a user with that email.
5. If the user exists:
   - Generate a cryptographically secure reset token (e.g., 32 bytes, base64).
   - Hash the token using SHA-256.
   - Store in `password_resets` table: `{ userId, tokenHash, expiresAt: now + 24h, used: false }`.
   - Send an email with a link: `https://app.com/reset-password?token={plaintext_token}&email={email}`.
6. If the user doesn't exist, return the same success response (no email enumeration).
7. The SPA shows **"Check your email"** message and a cooldown timer for re-requests.

## Flow — Perform Reset

1. User clicks the email link or manually navigates to `/reset-password` with the token from email.
2. The SPA POSTs to `POST /api/auth/reset-password` with `{ email, token, newPassword }`.
3. The endpoint queries `password_resets` for the (email, tokenHash) pair.
4. Validation checks:
   - Token exists, is not yet used (`used == false`), and has not expired (`expiresAt > now`).
   - New password meets complexity requirements.
5. On success:
   - Hash the new password with `Argon2Hasher.Hash(newPassword)`.
   - Update the `users` table with the new password hash.
   - Mark the password reset token as used (`used = true`).
   - Delete or revoke all refresh tokens for this user (force re-login on all devices).
   - Send a confirmation email.
   - Return `200 OK`.
6. The SPA navigates to `/login` and shows **"Password reset successful"** message.
7. User logs in with the new password.

## Alternatives and errors

- **> 3 requests per hour for the same email** → `429 Too Many Requests` with `Retry-After`.
- **Token missing, expired, or already used** → `400 Bad Request` with **"Link is expired or invalid"**.
- **Invalid token for email pair** → `400 Bad Request` (no existence leak).
- **Password doesn't meet requirements** → `400 Bad Request` with requirements list.
- **Email not found (step 1)** → `200 OK` with generic success (no enumeration).

## Sequence diagram

![Reset password sequence](43-reset-password.png)
