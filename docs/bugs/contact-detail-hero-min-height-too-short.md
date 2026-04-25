# Contact-detail hero min-height is 260, design says 320

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The contact-detail hero's gradient backdrop is 60px shorter than the design specifies, so the ambient gradient cuts off behind the hero name + tags before resolving to the page background.

In `docs/ui-design.pen` the contact-detail hero background (`cNcxs`) is exactly 320px tall:

```json
{ "id": "cNcxs", "name": "heroBg", "height": 320, ... }
```

The 320px gives the gradient room to fade smoothly from `#7C3AFF` (top) → `#BF40FF` (60%) → `#0A0A16` (page bg) right under the action row. Implementation min-heights it at 260, so the fade compresses.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.hero {
  position: relative;
  min-height: 260px;
  ...
}
```

## Expected

```css
.hero {
  position: relative;
  min-height: 320px;
  ...
}
```

## Fix sketch

One-token swap.
