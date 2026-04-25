# Forgot- and reset-password pages ship `.page` gap 16, design says 32

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md), Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. The forgot-password and reset-password pages share the same `.page` shell shape as login / register; the analogous content-column gap was already brought into spec for those two pages (`login-page-section-gap-too-tight.md`, `register-page-typography-and-gap-mismatch.md`). The recovery flow lags behind on the same value.

In `docs/ui-design.pen` the forgot-password content column (`uevQr`) declares `gap: 32`. The reset-password screen mirrors it (the design lives in the same auth-shell shape).

## Observed

`frontend/src/app/pages/forgot-password/forgot-password.page.css`:

```css
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  ...
}
```

`frontend/src/app/pages/reset-password/reset-password.page.css` carries the same `.page { gap: 16px }`.

## Expected

```css
.page {
  ...
  gap: 32px;
  ...
}
```

## Fix sketch

One-token swap on each page. The `form { gap: 16px }` rule below stays untouched, so input rows keep their tighter rhythm; only gaps between top-level sections (back row, brand, hero, form, hint/aux) open up to the design value.
