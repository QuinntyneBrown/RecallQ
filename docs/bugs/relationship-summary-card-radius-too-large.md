# Relationship summary card border-radius is 20, design says 18

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The AI relationship summary card on contact-detail rounds at the page-wide `--radius-lg` (20px), but the design's aiSummary specifies 18.

In `docs/ui-design.pen` the AI summary block (`GwZQR`):

```json
{ "id": "GwZQR", "cornerRadius": 18, ... }
```

## Observed

`frontend/src/app/ui/relationship-summary-card/relationship-summary-card.component.css`:

```css
.ai-card {
  ...
  border-radius: var(--radius-lg);
  ...
}
```

## Expected

```css
.ai-card {
  ...
  border-radius: 18px;
  ...
}
```

## Fix sketch

One literal swap.
