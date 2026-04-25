# Home `By meaning, not memory.` subtitle is missing the purple→pink gradient

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The hero subtitle on `/home` is rendered in flat muted text instead of the brand gradient.

In `docs/ui-design.pen` node `KhJIT` (the second hero line of frame `1. Vector Search Home`), `By meaning, not memory.` is filled with the brand linear gradient `#7C3AFF → #FF5EE7` at 90°, font-size 34, font-weight 700, letter-spacing -1.2. In implementation it is rendered with `--foreground-muted` (a flat gray-purple) at font-size 32 / weight 600 — none of the gradient, size, or weight match the design.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.hero-sub {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--foreground-muted);
}
```

The subtitle reads as muted gray on the deep background. The vibrant magenta/pink "by meaning" intent that the design uses to land the value prop is absent.

## Expected

`By meaning, not memory.` should render with a 90° linear gradient from `--accent-gradient-start` (`#7C3AFF`) to `--accent-gradient-end` (`#FF5EE7`), at the same scale as the line above it (font-size 34, font-weight 700, letter-spacing -0.03em / -1.2px).

## Fix sketch

Apply the gradient via `background: linear-gradient(...)` plus `-webkit-background-clip: text; color: transparent;` (the same technique the design system already uses elsewhere). Match the typographic scale of `.hero-title` (34/700) and add the `-1.2px` letter-spacing.
