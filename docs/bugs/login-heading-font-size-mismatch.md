# Login `Sign in` heading is 28px instead of 32px

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The login headline ships smaller than the design specifies, so it does not hold the same hierarchical weight against the form below it.

In `docs/ui-design.pen` the login hero frame (`qoVhd` → `G5WFb` "Sign in"):

```json
{
  "fontFamily": "Geist",
  "fontSize": 32,
  "fontWeight": "700",
  "letterSpacing": -0.8
}
```

The implementation declares only `font-size: 28px` on `h1` (font-family/weight come from the global `h1..h6` and browser defaults). The font-family is already Geist via the global rule and the weight is already 700 from the user-agent stylesheet, so this bug is strictly the size and tracking.

## Observed

`frontend/src/app/pages/login/login.page.css`:

```css
h1 {
  color: var(--foreground-primary);
  font-size: 28px;
  margin: 0;
}
```

## Expected

```css
h1 {
  color: var(--foreground-primary);
  font-size: 32px;
  letter-spacing: -0.8px;
  margin: 0;
}
```

## Fix sketch

Two-property CSS change. Markup unchanged.
