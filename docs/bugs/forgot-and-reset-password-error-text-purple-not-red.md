# Forgot- and reset-password error text paints purple, not the design's red

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md), Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. Both auth-recovery pages render their inline `.err` message in `--accent-secondary` brand magenta, the same gap login and register had before `auth-error-text-purple-not-red.md` shipped. Errors should read as failures, not as brand accents.

In `docs/ui-design.pen` error states use red (`#FFB3B3` text on `#FF6B6B14` background — see the Add Contact validation patterns under frame `e9D7e`). Login and register were already brought into spec.

## Observed

`frontend/src/app/pages/forgot-password/forgot-password.page.css`:

```css
.err {
  color: var(--accent-secondary);
  font-size: 14px;
}
```

`frontend/src/app/pages/reset-password/reset-password.page.css` carries the same rule.

## Expected

```css
.err {
  color: #FFB3B3;
  font-size: 14px;
}
```

## Fix sketch

Two-token swap on each page. Mirrors the analogous fix already shipped on login + register.
