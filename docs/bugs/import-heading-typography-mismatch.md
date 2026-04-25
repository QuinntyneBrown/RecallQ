# Import page heading is 24px / no tracking, design says 28 / -0.6

**Status:** Open
**Flow:** [Import CSV](../flows/)
**Severity:** Low — visual / brand fidelity. The import page heading sits at 24px with no letter-spacing, but the design's hero heading is Geist 28/700 with `-0.6px` tracking.

In `docs/ui-design.pen` the Import — Idle hero (`rVYDJ`) declares the heading:

```json
{
  "content": "Bulk import",
  "fontFamily": "Geist",
  "fontSize": 28,
  "fontWeight": "700",
  "letterSpacing": -0.6
}
```

Implementation declares only `font-size: 24px` on the h1. Font-family Geist comes from the global `h1..h6` rule and weight 700 from the user-agent stylesheet, so this fix is the size and tracking only.

## Observed

`frontend/src/app/pages/import/import.page.css`:

```css
h1 { font-size: 24px; margin: 0; }
```

## Expected

```css
h1 {
  font-size: 28px;
  letter-spacing: -0.6px;
  margin: 0;
}
```

## Fix sketch

Two-property CSS change. Markup unchanged.
