# Forgot- / reset-password headings ship without the design's -0.8px tracking

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md), Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. Both auth-recovery headings already match the design's font-size (32px, after the recent gap fixes), but neither declares the `-0.8px` letter-spacing the design specifies. Login and register were brought into spec on this exact value (`login-heading-font-size-mismatch.md`, `register-page-typography-and-gap-mismatch.md`); the recovery pages still lag.

In `docs/ui-design.pen` the forgot-password heading (`gd6ev` → `lxKY9`) and the reset-password heading (analogous shape) both declare:

```json
{ "fontFamily": "Geist", "fontSize": 32, "fontWeight": "700", "letterSpacing": -0.8 }
```

The implementation declares font-size 32 only.

## Observed

`frontend/src/app/pages/forgot-password/forgot-password.page.css` and `frontend/src/app/pages/reset-password/reset-password.page.css`:

```css
h1 {
  color: var(--foreground-primary);
  font-size: 32px;
  margin: 8px 0 0;
}
```

## Expected

```css
h1 {
  color: var(--foreground-primary);
  font-size: 32px;
  letter-spacing: -0.8px;
  margin: 8px 0 0;
}
```

## Fix sketch

One-line CSS addition on each page. Keeps the existing margin-top: 8 (which accounts for the page column gap), only the typography tightens.
