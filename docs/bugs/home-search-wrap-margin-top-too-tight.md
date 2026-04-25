# Home search bar sits too close to the hero subtitle

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The search pill nests right under the description with only 8px of breath, so the hero block and the primary affordance read as one merged stripe instead of two distinct beats.

In `docs/ui-design.pen` the home frame (`SZRuv`) places the hero column (`MXtnM`) at `y: 118` and the search bar (`jTWqU`) at `y: 308`. The hero column's three children (greeting + heroTitleRow + subtitle) span roughly `y: 118 → y: 240`, so the gap between the hero block and the search bar is ~68px in the design. With the AI suggestion card and chip row hidden in zero state, an exact 68px on its own is over-large; the smallest faithful step that honours the design's intent (clear separation between the hero and the search affordance) is **24px** — three times the current value and still within a sensible 8px grid.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-wrap {
  position: relative;
  margin-top: 8px;
}
```

## Expected

```css
.search-wrap {
  position: relative;
  margin-top: 24px;
}
```

## Fix sketch

One-line CSS bump from 8 → 24. No HTML change. The hero column rhythm (greeting → headline → subtitle at 14px gaps) stays intact; only the gap below the hero block, before the search affordance, opens up.
