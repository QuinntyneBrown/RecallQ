# Home search icon and input left padding both off by 2px

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The leading icon and the typed text both sit 2px further right than the design specifies, shifting the whole left edge of the search affordance away from the design's 18px gutter.

In `docs/ui-design.pen` the reusable `Search Bar` component (`lpCnN`) is a flex container with `padding: [0, 18]` and `gap: 12`. The first child is the magnifying-glass icon (`3L91d`, 20×20). So:

- icon left edge = 18px from the input box
- icon right edge = 18 + 20 = 38px
- text start = 38 + 12 (gap) = 50px

The implementation positions the icon absolutely at `left: 20px` and offsets the input text with `padding-left: 52px`. Both numbers are 2px high vs. the design.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-icon {
  position: absolute;
  left: 20px;
  ...
}
.search-input {
  ...
  padding: 0 18px 0 52px;
}
```

## Expected

```css
.search-icon {
  position: absolute;
  left: 18px;
  ...
}
.search-input {
  ...
  padding: 0 18px 0 50px;
}
```

## Fix sketch

Two-property CSS change. Markup unchanged. The 12px icon → text gap (38 → 50) and the 18px gutter both come into spec.
