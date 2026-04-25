# Contact-detail action row gap is 8, design says 10

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The four quick-action tiles (Message, Call, Intro, Ask AI) sit 8px apart, but the design's action row spaces them at 10.

In `docs/ui-design.pen` the contact-detail action row (`eED35`):

```json
{ "id": "eED35", "name": "actionRow", "justifyContent": "space_between", "gap": 10 }
```

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.actions {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  padding: 0 24px;
}
```

## Expected

```css
.actions {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  padding: 0 24px;
}
```

## Fix sketch

One-token swap.
