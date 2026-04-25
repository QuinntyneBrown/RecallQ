# API interceptor 401 redirect loses the current URL

**Flow:** 04 — Authenticated Request (with login flow 02)
**Severity:** Medium-High (UX, parity with auth-guard fix)
**Status:** Open

## Symptom

`installApiInterceptor` is wired in `app.config.ts` to call:

```ts
installApiInterceptor(() => {
  auth.authState.set(null);
  void router.navigateByUrl('/login');   // <— bare /login, no returnUrl
});
```

The earlier `authGuard` returnUrl fix preserves the attempted URL
when an *unauthenticated* user navigates to a protected route. But
when a session expires *mid-session* (e.g., the user is on
`/contacts/abc` and a backend call returns 401), this interceptor
fires and dumps the user on bare `/login`. After signing back in,
the user lands on `/home` instead of returning to where they were —
the same UX gap that auth-guard previously had.

## Expected

- The interceptor reads the current `router.url`.
- If the URL is anything other than `/login` (or empty) it appends
  `returnUrl=<encoded path>` to the redirect.
- After re-login the user lands back on the page they were viewing.

## Actual

`/login` always, no returnUrl. Sessions that expire while the user
is reading a contact / triaging interactions / drafting a search
all silently jettison the destination.

## Repro

1. Sign in.
2. Open `/contacts/abc` (or any protected route).
3. Force a 401 from a backend call (e.g., manually invalidate the
   server-side session, or stub a route to return 401 in tests).
4. Observe URL transitions to bare `/login`, not
   `/login?returnUrl=/contacts/abc`.

## Notes

Radically simple fix: in `app.config.ts`, build the redirect URL
inside the `installApiInterceptor` callback by reading `router.url`
and routing through the already-existing `safeReturnUrl` helper /
the same encoded-path pattern used by `authGuard`. Treat `/login`,
`/`, and empty as "no returnUrl".
