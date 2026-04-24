# Register page surfaces raw error key `register_failed`

**Status:** Complete — `auth.service.ts` reads the server's `{ error }` body and `register.page.ts` maps codes through `ERROR_MESSAGES` to user-facing copy.
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L2-001, L2-053, L1-015.
**Severity:** Medium — visitors see an internal error identifier instead of an actionable message.

## Observed

Submitting a weak password (`"short"`) on `/register` results in the red inline error text **`register_failed`**. The password rule is never explained.

Screenshot: [`screenshots/04-register-weak-password.png`](screenshots/04-register-weak-password.png).

Server response captured during the Flow 01 walkthrough:
```
status: 400
body:   { "error": "weak_password" }
```

## Expected

The UI should translate the server's `error` code into a user-facing message. For `weak_password`:

> Password must be at least 12 characters and include both letters and digits.

For `invalid_email`:

> Please enter a valid email address.

For `email_taken` (409):

> An account with this email already exists. [Log in](./login) instead?

## Root cause

`frontend/src/app/auth/auth.service.ts` only discriminates on status 409:

```ts
if (!res.ok && res.status !== 201) {
  if (res.status === 409) throw new Error('email_taken');
  throw new Error('register_failed');
}
```

It never reads the JSON body `{ error }`, and it uses a non-localised `Error` message. `register.page.ts` then prints that message raw (`this.error.set(e?.message ?? 'error')`).

## Fix sketch

In `auth.service.ts`, parse the body and throw a typed error:

```ts
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new AuthError(res.status, body.error ?? 'register_failed');
}
```

In `register.page.ts`, map the code to copy:

```ts
const messages: Record<string, string> = {
  invalid_email: 'Please enter a valid email address.',
  weak_password: 'Password must be at least 12 characters and include both letters and digits.',
  email_taken: 'An account with this email already exists.',
  register_failed: 'We could not create your account. Please try again.',
};
this.error.set(messages[e.code] ?? messages.register_failed);
```
