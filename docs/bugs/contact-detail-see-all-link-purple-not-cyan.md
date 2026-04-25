# Contact-detail "See all" link paints purple, design says cyan

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The "See all N" link next to the timeline header tints `--accent-primary` purple. The design's "See all" treatment across the app — home Smart stacks (`DPGF8`), contact-detail timeline (`M4dBa`) — uses cyan `#4BE8FF`.

In `docs/ui-design.pen` the timeline see-all link (`SudXW` → `M4dBa`):

```json
{ "content": "See all 24", "fill": "#4BE8FF", "fontFamily": "Inter", "fontSize": 12, "fontWeight": "500" }
```

Implementation paints purple at 14px / inherited weight.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.activity-head a { color: var(--accent-primary); text-decoration: none; font-size: 14px; }
```

## Expected

```css
.activity-head a {
  color: var(--accent-tertiary);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
}
```

## Fix sketch

Three-property change. The link now sits at the design's cyan / 12px / 500 cut, matching the home page "See all" treatment (which is already cyan).
