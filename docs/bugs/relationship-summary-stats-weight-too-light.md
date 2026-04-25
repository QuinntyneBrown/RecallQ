# Relationship summary stats values are 600 weight, design says 700

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The three stat values (Interactions count, Sentiment label, Since last) inside the AI relationship summary card render at 600 weight, but the design specifies 700 — a heavier cut so the values sit confidently above the 10px sub-labels below.

In `docs/ui-design.pen` the stat values declare:

```json
{ "id": "rOL0r", "content": "24",      "fontWeight": "700" }
{ "id": "3QIP4", "content": "Warm",    "fontWeight": "700" }
{ "id": "uiV1z", "content": "3 days",  "fontWeight": "700" }
```

## Observed

`frontend/src/app/ui/relationship-summary-card/relationship-summary-card.component.css`:

```css
.stats strong {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground-primary);
}
```

## Expected

```css
.stats strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--foreground-primary);
}
```

## Fix sketch

One-token swap.
