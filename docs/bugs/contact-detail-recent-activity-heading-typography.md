# Contact-detail "Recent activity" heading is 18px, design says 15

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The "Recent activity" heading above the timeline ships at 18px with no letter-spacing, but the design's section heading is Geist 15/700 with `-0.2px` tracking — sized to read as a section label, not a primary header.

In `docs/ui-design.pen` the timeline header (`KhKeJ` → `u8iUA`):

```json
{
  "content": "Recent activity",
  "fontFamily": "Geist",
  "fontSize": 15,
  "fontWeight": "700",
  "letterSpacing": -0.2
}
```

Implementation:

```css
.activity-head h2 { margin: 0; font-size: 18px; font-family: Geist, system-ui, sans-serif; }
```

font-family is fine. font-size 18 → 15 and add letter-spacing -0.2.

## Expected

```css
.activity-head h2 {
  margin: 0;
  font-size: 15px;
  letter-spacing: -0.2px;
  font-family: Geist, system-ui, sans-serif;
}
```

## Fix sketch

Two-property CSS change.
