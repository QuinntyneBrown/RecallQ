# Login does not honour return-URL after auth-guard redirect

**Flow:** 02 — User Login (with auth guard from flow 04)
**Severity:** Medium-High (UX, deep links lose destination)
**Status:** Complete — `authGuard` now reads the attempted segments and redirects to `/login?returnUrl=<encoded path>`. New `auth/return-url.ts` exports a `safeReturnUrl()` helper that defaults to `/home` and rejects protocol-relative `//` strings. `LoginPage` and `RegisterPage` inject `ActivatedRoute` and route through `safeReturnUrl(queryParamMap.get('returnUrl'))` after a successful sign-in / register.

## Symptom

`authGuard` redirects unauthenticated users to a bare `/login`:

```ts
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.authState() !== null) return true;
  return router.parseUrl('/login');   // <— no returnUrl param
};
```

`LoginPage.onSubmit` then unconditionally navigates to `/home`:

```ts
await this.auth.login(this.email(), this.password());
await this.router.navigateByUrl('/home');
```

So a user who:

1. Receives a shared link to `/contacts/abc`,
2. Is not signed in,
3. Gets bounced to `/login`,
4. Signs in,

ends up at `/home` instead of `/contacts/abc`. The original URL —
the entire reason they followed the link — is silently dropped.
The same is true for any session that expires mid-session and gets
redirected by `installApiInterceptor`.

## Expected

- `authGuard` redirects to `/login?returnUrl=<original-url>`.
- `LoginPage` reads `returnUrl` from the query params after a
  successful login and navigates there. Falls back to `/home` if
  the param is missing or points outside the SPA's relative paths
  (open-redirect guard).

## Actual

`authGuard` always redirects to `/login`. LoginPage always lands the
user on `/home`.

## Repro

1. Register and log in normally.
2. Log out (`/logout`).
3. Open `/contacts/abc` in a fresh tab — observe the URL flips to
   `/login` (no returnUrl param).
4. Sign in. Observe the URL becomes `/home`, not the original
   `/contacts/abc`.

## Notes

Radically simple fix:

- Update `authGuard` to read the attempted `segments`, rebuild the
  URL, and `router.parseUrl('/login?returnUrl=' + encodeURIComponent(url))`.
- Update `LoginPage` to inject `ActivatedRoute`, read the
  `returnUrl` query param on submit, and navigate to it (only if it
  starts with `/`).
- Same treatment in `RegisterPage` so the post-register login also
  honours the param.
