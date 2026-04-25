# Search result card uses --surface-elevated, design says --surface-secondary

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. Search result cards on `/search` paint `--surface-elevated` (#1B1B33), but the design's result cards (`A4c7W`, `pwLgb`) fill with `--surface-secondary` (#141425) — one shade darker, sitting just above the page background. The pattern matches the recently-fixed relationship summary card and the design's "AI / data surface" intent: `--surface-secondary` for content surfaces, `--surface-elevated` for interactive controls.

In `docs/ui-design.pen` the result cards declare `fill: #141425`. The implementation reaches for the elevated token instead.

## Observed

`frontend/src/app/ui/result-card/result-card.component.css`:

```css
.card {
  ...
  background: var(--surface-elevated);
  ...
}
```

## Expected

```css
.card {
  ...
  background: var(--surface-secondary);
  ...
}
```

## Fix sketch

One-token swap.
