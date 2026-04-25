# Auth-recovery `Back to sign in` link weight is 600, design says 500

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md), Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. The "← Back to sign in" link at the top of the forgot- and reset-password pages renders with a 600 weight, heavier than the design's 500.

In `docs/ui-design.pen` the back row (`UZHtz` → `8lMQG`):

```json
{
  "content": "Back to sign in",
  "fontFamily": "Inter",
  "fontSize": 14,
  "fontWeight": "500",
  "fill": "#B8B8D4"
}
```

The `.back` rule on each page uses `font-weight: 600`, which makes the back link compete visually with the page headline below.

## Observed

`frontend/src/app/pages/forgot-password/forgot-password.page.css`:

```css
.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--foreground-secondary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
```

`frontend/src/app/pages/reset-password/reset-password.page.css` carries the same rule.

## Expected

```css
.back {
  ...
  font-weight: 500;
}
```

## Fix sketch

One-token swap on each page. The link stays an inline-flex with arrow + text; only the weight comes down to the design's 500.
