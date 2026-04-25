# Contact-detail name heading is 28px / no tracking, design says 24 / -0.5

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The contact name heading on `/contacts/:id` is 28px with no letter-spacing, but the design's hero name is Geist 24/700 with `-0.5px` tracking.

In `docs/ui-design.pen` the contact-detail hero name (`wOANK` → `zdpNl`):

```json
{
  "content": "Sarah Mitchell",
  "fontFamily": "Geist",
  "fontSize": 24,
  "fontWeight": "700",
  "letterSpacing": -0.5
}
```

Implementation declares `font-size: 28px`. Font-family Geist comes from the hero rule already; weight 700 from the user-agent stylesheet.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
h1 {
  margin: 8px 0 0;
  font-family: Geist, system-ui, sans-serif;
  font-size: 28px;
  color: var(--foreground-primary);
}
```

## Expected

```css
h1 {
  margin: 8px 0 0;
  font-family: Geist, system-ui, sans-serif;
  font-size: 24px;
  letter-spacing: -0.5px;
  color: var(--foreground-primary);
}
```

## Fix sketch

Two-property CSS change. Markup unchanged.
