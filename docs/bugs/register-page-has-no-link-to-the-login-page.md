# Register page has no link to the login page

**Status:** Complete — `/register` now has "Already have an account? Log in" and `/login` has the inverse "Don't have an account? Create one".
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-001, L1-015.
**Severity:** Low — affects returning users who landed on `/register` by mistake.

## Observed

`/register` has no affordance to navigate to `/login`. The only clickable elements are the form fields, the "Create account" submit button, and the bottom nav (itself a separate bug — *Bottom nav is visible on unauthenticated pages*).

Symmetrically, `/login` does not include a "Create account" link to `/register`.

Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png).

## Expected

Below the submit button, show:

> Already have an account? **Log in**

Link → `/login`. On `/login`, show the inverse:

> Don't have an account? **Create one**

Link → `/register`.

## Fix sketch

In `frontend/src/app/pages/register/register.page.ts`, append:

```html
<p class="aux">
  Already have an account?
  <a routerLink="/login">Log in</a>
</p>
```

Register the `RouterLink` directive in the component imports.
