# Register page has no product branding or logo

**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012.
**Severity:** Low — first-impression / branding gap.

## Observed

`/register` shows a lone `<h1>Create account</h1>` on an empty dark surface. No product name, no logo, no tagline. A visitor who lands here from an external link has no cue they are on RecallQ.

Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png).

## Expected

Every screen in `docs/ui-design.pen` (Home, Search Results, Contact Detail, Ask) begins with the `RecallQ` logo + product name at the top of the top bar (home node `byXgP` → `logo` in frame `SZRuv`). The register screen should reuse that same logo mark so the visitor lands on a clearly branded product surface.

## Fix sketch

Add a small top band to `register.page.ts` mirroring the logo layout from the home `topbar` (group `pfwBR`), scoped to just the logo (no notifications / profile controls are meaningful when unauthenticated):

```html
<header class="top">
  <span class="logo-dot"></span>
  <span class="logo-text">RecallQ</span>
</header>
```

with a shared `app-brand` component if one exists elsewhere. Same treatment should be applied to `/login`.
