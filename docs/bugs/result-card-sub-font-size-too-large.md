# Result-card sub line is 13px, design says 12

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The role/org sub line under a result-card name renders at 13px, but the design specifies 12 — half a step tighter to keep the secondary copy from competing with the 15px name above.

In `docs/ui-design.pen` the result-card sub line (`SuhQ1`):

```json
{ "content": "CTO · Anthropic · SF", "fontFamily": "Inter", "fontSize": 12, "fontWeight": "normal", "fill": "#B8B8D4" }
```

## Observed

`frontend/src/app/ui/result-card/result-card.component.css`:

```css
.sub { color: var(--foreground-secondary); font-size: 13px; }
```

## Expected

```css
.sub { color: var(--foreground-secondary); font-size: 12px; }
```

## Fix sketch

One-token swap.
