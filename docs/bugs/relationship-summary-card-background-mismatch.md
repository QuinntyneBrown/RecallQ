# Relationship summary card uses --surface-elevated, design says --surface-secondary

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The AI relationship summary card on contact-detail paints `--surface-elevated` (#1B1B33), but the design's aiSummary fills with `--surface-secondary` (#141425) — one shade darker, sitting closer to the page background.

In `docs/ui-design.pen` the AI summary block (`GwZQR`):

```json
{ "id": "GwZQR", "name": "aiSummary", "fill": "#141425", "cornerRadius": 18, ... }
```

`#141425` is the project's `--surface-secondary` token; the implementation reaches for `--surface-elevated` (`#1B1B33`) which is the next surface up.

## Observed

`frontend/src/app/ui/relationship-summary-card/relationship-summary-card.component.css`:

```css
.ai-card {
  background: var(--surface-elevated);
  ...
}
```

## Expected

```css
.ai-card {
  background: var(--surface-secondary);
  ...
}
```

## Fix sketch

One-token swap.
