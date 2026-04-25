# Brand wordmark renders in Inter, not Geist

**Status:** Open
**Flow:** [shell — chrome](../flows/) (the `app-brand` component renders on every login / register / unauth page)
**Severity:** Low — visual / brand fidelity. The "RecallQ" wordmark inherits Inter from the body stack, but the design specifies Geist — the same display face used by every other wordmark and headline in `docs/ui-design.pen`.

In `docs/ui-design.pen` the brand text appears as `BtEcS` / `eRYEq` / `jYVgp` (login, register, home topbar). All three declare:

```json
{ "fontFamily": "Geist", "fontSize": 18, "fontWeight": "600", "letterSpacing": -0.3 }
```

Font-size, font-weight, and letter-spacing now match the implementation (the latter was just patched). Only the typeface remains.

## Observed

`frontend/src/app/ui/brand/brand.component.css`:

```css
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--foreground-primary);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
```

No `font-family`, so the wordmark inherits Inter from `frontend/src/styles.css` body.

## Expected

```css
.brand {
  ...
  font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  ...
}
```

## Fix sketch

Add the heading-stack `font-family` (mirrors the global `h1..h6` rule and the recently-fixed `.hero-sub` / `.clock` / `app-button-primary`). One-line change in the shared component, every page mounting `<app-brand/>` matches the design face.
