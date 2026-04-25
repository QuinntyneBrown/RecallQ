# Button Primary label is Inter 16 instead of Geist 15

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md), [02 — Authentication](../flows/02-authentication/02-authentication.md), and every other primary CTA.
**Severity:** Low — visual / brand fidelity. The shared `app-button-primary` paints its label in the body's Inter at 16/600, but the design specifies Geist 15/600 — the same display face the headline uses.

In `docs/ui-design.pen` the reusable `Button Primary` (`8VJjL` → `K01yN`):

```json
{
  "fontFamily": "Geist",
  "fontSize": 15,
  "fontWeight": "600",
  "fill": "#FFFFFF"
}
```

Font-weight already matches. The component declares `font-size: 16px` and no `font-family`, so it inherits Inter from the body stack instead.

## Observed

`frontend/src/app/ui/button-primary/button-primary.component.css`:

```css
button {
  ...
  font-size: 16px;
  font-weight: 600;
  ...
}
```

## Expected

```css
button {
  ...
  font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  ...
}
```

## Fix sketch

Add the heading-stack `font-family` (mirrors the global `h1..h6` rule and the recently-fixed `.hero-sub` / `.clock`) and drop `font-size` from 16 to 15. Single source of truth for every primary CTA.
