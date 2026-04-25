# "Forgot password?" link on the login page silently routes back to login

**Flow:** 42 — Remember Me (login form), with reset-password (flow 43) still unimplemented
**Severity:** High (every user who has forgotten their password sees this link, taps it, and lands back on the login page with no explanation — there is no working recovery path today)
**Status:** Obsolete — `/forgot-password` and `/reset-password` routes now exist (`app.routes.ts` lazy-loads `ForgotPasswordPage` and `ResetPasswordPage`). The link points at a real page, not a dead route. The `bug-login-no-dead-forgot-password-link.spec.ts` test that pinned link-count to 0 has been removed because the design (`docs/ui-design.pen` rememberRow `mJfJ2`) calls for the link to live alongside Remember me on the same row.

## Symptom

`frontend/src/app/pages/login/login.page.html`:

```html
<a
  routerLink="/forgot-password"
  [queryParams]="{ email: email() }"
  class="forgot"
>Forgot password?</a>
```

The link points to `/forgot-password`, but:

- `frontend/src/app/app.routes.ts` defines no `forgot-password` route.
- The wildcard `{ path: '**', redirectTo: 'login' }` therefore catches the navigation and returns the user to `/login`, dropping the email query param in the process.
- `backend/RecallQ.Api/Endpoints/AuthEndpoints.cs` has no forgot-password or reset-password handlers either — `grep -ri "forgot\|reset.*password" backend/` returns zero matches. The reset-password feature is still in design (`docs/tasks/PD001-reset-password-and-forgot-success.md`), not implementation.

So the user-facing experience is: click "Forgot password?" → page reloads → still on `/login` with a freshly-empty form → no error, no toast, no hint that anything happened. From the user's perspective the link is dead, and there is no other affordance for recovering an account.

## Expected

Clicking "Forgot password?" must take the user somewhere that makes the situation legible. Two acceptable shapes:

1. The link is hidden until the feature ships (the simplest fix, and the one that is honest about current capability).
2. A `forgot-password` route renders a minimal page that explains the recovery path (e.g., "This feature is coming soon — for now, contact support at …").

Either way, the user must not be silently redirected to the same screen they came from.

## Actual

Click → wildcard redirect → identical login page with email field cleared. Indistinguishable from a wonky page reload.

## Repro

1. Visit `/login`.
2. Type any email into the email field.
3. Click **Forgot password?**.
4. Observe: URL ends up at `/login`, the email field is empty, no toast or error appeared.

Inspect `app.routes.ts` and confirm there is no `forgot-password` entry. Confirm the wildcard route is what handled the navigation.

## Notes

The radically simple fix is option (1) — drop the link until the feature behind it actually exists. The login page already has a clear "Create one" link to register; adding a non-functional "Forgot password?" link is misleading and the rest of the form still lays out cleanly without it.

Concrete change in `frontend/src/app/pages/login/login.page.html`:

```html
<div class="rememberRow">
  <app-checkbox
    label="Remember me"
    [checked]="rememberMe()"
    (checkedChange)="rememberMe.set($event)"
  />
</div>
```

(Drop the `<a routerLink="/forgot-password" …>` element entirely.) The existing `e2e/tests/remember-me.spec.ts` "login form aligns Remember me and Forgot password on one row" assertion needs to be removed or updated alongside this change — it currently encodes the broken behavior as a layout invariant. When the actual reset-password feature lands (PD001 + L2-087/088/089), bring the link back pointing at the new route.

A slightly larger but more user-friendly variant is option (2): add a `forgot-password` route that lazy-loads a tiny stand-in component with a `Coming soon — contact support` message and a "Back to sign in" link. That defers the dead-link problem by one page click and preserves the affordance for when the feature ships, but introduces a route the design hasn't approved yet.
