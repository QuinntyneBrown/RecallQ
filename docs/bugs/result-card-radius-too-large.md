# Search result card border-radius is 20, design says 18

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. Search result cards round at the page-wide `--radius-lg` (20px), but the design's result cards round at 18.

In `docs/ui-design.pen` the result cards `A4c7W` and `pwLgb` declare `cornerRadius: 18`. (The featured-result card `Zqt3I` uses 20 and is correct.)

## Observed

`frontend/src/app/ui/result-card/result-card.component.css`:

```css
.card {
  ...
  border-radius: var(--radius-lg);
  ...
}
```

## Expected

```css
.card {
  ...
  border-radius: 18px;
  ...
}
```

## Fix sketch

One literal swap on the regular result card. Featured-result-card stays at 20 per design.
