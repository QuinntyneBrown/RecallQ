# Status bar paints a solid surface instead of letting the page show through

**Status:** Open
**Flow:** [shell — chrome](../flows/) (status bar is part of the global shell)
**Severity:** Low — visual / brand fidelity. The status bar at the top of every page paints the same solid `--surface-primary` token, which means it sits as a discrete strip over the page rather than blending into the page background as the design intends.

In `docs/ui-design.pen` the reusable `Status Bar` component (`kauhQ`):

```json
{ "fill": "#00000000" }
```

`#00000000` is transparent. The expectation is that the status bar paints nothing of its own — the gradient/ambient background of the screen behind it carries through. The implementation hard-codes the opaque surface token, so the status bar always reads as a separate horizontal stripe.

## Observed

`frontend/src/app/ui/status-bar/status-bar.component.css`:

```css
.status-bar {
  height: 50px;
  background: var(--surface-primary);
  ...
}
```

## Expected

```css
.status-bar {
  height: 50px;
  background: transparent;
  ...
}
```

## Fix sketch

One-line CSS change. No HTML or component change. The page below the status bar already paints `--surface-primary` (or richer when ambient glows land), so dropping the status bar's own fill matches the design intent without leaving the strip unstyled.
