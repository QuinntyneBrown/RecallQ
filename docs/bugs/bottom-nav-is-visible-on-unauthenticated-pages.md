# Bottom nav is visible on unauthenticated pages

**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-001, L1-011, L2-003.
**Severity:** Medium — broken UX; tapping a nav tab bounces the user back to login.

## Observed

On `/register` (and `/login`, `/logout`), the bottom navigation bar is rendered and all four tabs (Home, Search, Ask, Profile) are tappable. Tapping any tab triggers the `authGuard`, which immediately redirects the visitor back to `/login`. From the visitor's perspective, tapping nav items appears to "do nothing" (or flashes back to the same page).

Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png) — bottom nav visible at the bottom of the register screen.

## Expected

The bottom nav (and sidebar on ≥ MD) should be hidden while the user is unauthenticated. The register/login screens should present only their form and product chrome.

No frame in `docs/ui-design.pen` shows a bottom nav on an unauthenticated context. (The design does not define register/login at all — see *Register screen not defined in ui-design.pen*.)

## Root cause

`frontend/src/app/app.ts` unconditionally renders `<app-bottom-nav>` and `<app-home-indicator>` below MD, regardless of authentication state.

```html
@if (!breakpoints.md()) {
  <app-bottom-nav class="bottom"/>
  <app-home-indicator class="home-ind"/>
}
```

## Fix sketch

Gate the chrome on `auth.isAuthenticated()`:

```html
@if (!breakpoints.md() && auth.isAuthenticated()) {
  <app-bottom-nav class="bottom"/>
  <app-home-indicator class="home-ind"/>
}
@if (breakpoints.md() && auth.isAuthenticated()) {
  <app-sidebar class="sidebar"/>
}
```

(Inject `AuthService` into `App`; it already exposes `isAuthenticated()`.)
