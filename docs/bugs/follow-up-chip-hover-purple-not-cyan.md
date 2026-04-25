# Follow-up chip hover paints purple border, design active state is cyan

**Status:** Open
**Flow:** [16 — Ask AI](../flows/16-ask-ai/16-ask-ai.md)
**Severity:** Low — visual / brand fidelity. Hovering a follow-up chip on `/ask` tints the border `--accent-primary` purple. The design's active follow-up chip (`CLlz8`) uses a cyan-tinted border (`#4BE8FF55`).

In `docs/ui-design.pen` the active follow-up chip:

```json
{ "id": "CLlz8", "stroke": { "fill": "#4BE8FF55", "thickness": 1 }, ... }
```

The implementation uses `--accent-primary` (purple) on hover, breaking the cyan-only interactive accent strategy.

## Observed

`frontend/src/app/ui/follow-up-chip/follow-up-chip.component.css`:

```css
.chip:hover { border-color: var(--accent-primary); }
```

## Expected

```css
.chip:hover { border-color: var(--accent-tertiary); }
```

## Fix sketch

One-token swap. Cyan hover matches the design's active state and the project's interactive accent.
