# Quick action tile active border paints purple, project accent is cyan

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The action-row tiles tint their active border `--accent-primary` purple. Like every other interactive accent recently swept onto cyan, the active state should match `--accent-tertiary` for consistency with the project's strategy.

## Observed

`frontend/src/app/ui/quick-action-tile/quick-action-tile.component.css`:

```css
.tile.active { border-color: var(--accent-primary); }
```

## Expected

```css
.tile.active { border-color: var(--accent-tertiary); }
```

## Fix sketch

One-token swap.
