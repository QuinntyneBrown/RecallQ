# Login page surfaces raw error keys

**Status:** Complete — `auth.service.ts` now maps 429 to `rate_limited`, and `login.page.ts` translates codes through `ERROR_MESSAGES`.
**Flow:** [02 — User Login](../flows/02-user-login/02-user-login.md)
**Traces:** L1-013, L2-002.
**Severity:** Medium — every failed sign-in shows an internal identifier instead of actionable copy.

## Observed

On `/login`, submitting wrong credentials renders the red inline error **`invalid_credentials`**. A transient server failure renders **`login_failed`**. A rate-limited burst (Flow 02 alternative) renders **`login_failed`** too — there is no signal that the user is being throttled.

`frontend/src/app/auth/auth.service.ts`:

```ts
async login(email: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/login', {...});
  if (res.status === 401) throw new Error('invalid_credentials');
  if (!res.ok) throw new Error('login_failed');
  ...
}
```

`frontend/src/app/pages/login/login.page.ts` prints the raw message:

```ts
} catch (e: any) {
  this.error.set(e?.message ?? 'error');
}
```

This is the same anti-pattern that was just fixed for `/register` in commit `2f5d1a7`, but for the login surface.

## Expected

The UI should translate internal codes to user-facing copy. Per Flow 02 security posture, **invalid credentials and unknown email must read the same** to avoid leaking which emails exist:

- `invalid_credentials` → "Email or password is incorrect."
- `rate_limited` (new — mapped from 429) → "Too many attempts. Try again in a minute."
- `login_failed` → "We could not sign you in. Please try again."

## Fix sketch

Mirror the register fix:

1. In `auth.service.ts`, distinguish 429 from other 5xx:
   ```ts
   if (res.status === 401) throw new Error('invalid_credentials');
   if (res.status === 429) throw new Error('rate_limited');
   if (!res.ok) throw new Error('login_failed');
   ```
2. In `login.page.ts`, map codes through an `ERROR_MESSAGES` record, falling back to `login_failed`.
