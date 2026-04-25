# Bottom nav background is fully opaque, not translucent

**Status:** Open
**Flow:** [shell — chrome](../flows/) (bottom nav is part of the global mobile shell)
**Severity:** Low — visual / brand fidelity. The bottom nav blocks the page underneath instead of letting it bleed through, breaking the floating-glass feel the design specifies.

In `docs/ui-design.pen` the reusable `Bottom Nav` component (`f4T0y`) declares:

```json
{ "fill": "#0A0A16E6" }
```

`#0A0A16E6` is `rgba(10, 10, 22, 0.9)` — the same surface-primary hex with a 90% alpha. Implementation paints the full opaque token instead, so when the nav floats above scrollable content nothing of that content is visible behind it.

## Observed

`frontend/src/app/ui/bottom-nav/bottom-nav.component.css`:

```css
.bottom-nav {
  height: 80px;
  background: var(--surface-primary);
  ...
}
```

## Expected

```css
.bottom-nav {
  height: 80px;
  background: rgba(10, 10, 22, 0.9);
  ...
}
```

## Fix sketch

One-line CSS change. The hex digits match `--surface-primary` so the colour intent is preserved; only the alpha changes. No HTML or component change.
