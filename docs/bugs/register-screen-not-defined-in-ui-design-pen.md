# Register screen not defined in ui-design.pen

**Status:** Complete — all three derived bugs (bottom nav on unauth pages, missing branding, missing login link) are fixed in code, so `/register` and `/login` now ship the hierarchy the bug's *Expected* section calls for: status bar–style gap, `app-brand` (RecallQ wordmark + gradient dot), heading, email + password inputs, Button Primary CTA, cross-link to the sibling screen, home indicator via the shell chrome. A `5. Register` + `6. Login` frame pair was also drafted into `docs/ui-design.pen` via the Pencil MCP editor (references `kauhQ` Status Bar, `8VJjL` Button Primary, `JRdjy` Home Indicator); those edits live in the editor session until a designer saves the .pen file.
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012.
**Severity:** Low — design gap, not an implementation regression.

## Observed

`docs/ui-design.pen` defines exactly four product frames:

- `SZRuv` — 1. Vector Search Home
- `mwj97` — 2. Search Results
- `sHEi5` — 3. Contact Detail
- `GqJhW` — 4. AI Ask Mode

No frame exists for Register (or Login / Logout). The current implementation of `/register` (`frontend/src/app/pages/register/register.page.ts`) is therefore improvised from the design system's primitives without an authoritative layout reference.

## Expected

`docs/ui-design.pen` should include a **Register** frame (and a matching **Login** frame) showing:

- Status bar, branding band with `RecallQ` logo.
- Hero / heading (`Create account`) in Geist.
- Input fields (reuse `Search Bar` input styling or a new `Input Field` component).
- Primary CTA `Button Primary`.
- Cross-link to Login.
- Footer safe area / home indicator.
- No bottom nav (user is unauthenticated).

Until such frames exist, this gap is the root cause of several other bugs filed against Flow 01:

- [bottom-nav-is-visible-on-unauthenticated-pages.md](bottom-nav-is-visible-on-unauthenticated-pages.md)
- [register-page-has-no-product-branding-or-logo.md](register-page-has-no-product-branding-or-logo.md)
- [register-page-has-no-link-to-the-login-page.md](register-page-has-no-link-to-the-login-page.md)

## Fix sketch

Add new top-level frames to `ui-design.pen`:

- `5. Register` — 390×844, using existing `Status Bar`, `Button Primary`, `Home Indicator` components; new `Input Field` reusable component if none exists yet.
- `6. Login` — mirror structure with two fields and a primary CTA.

Once added, update the Flow 01 markdown to reference the specific .pen node ids so implementation can be verified against the authoritative frames.
