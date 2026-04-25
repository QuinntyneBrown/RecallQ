# Home search input box-shadow does not match `ui-design.pen`

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The home search input ships with a thin 2px shadow at 20% black, but the design specifies a much softer-and-deeper 16px blur at 30% black offset 4px down — the kind of lift that makes the pill feel like the primary affordance on the page.

In `docs/ui-design.pen` the reusable `Search Bar` component (`lpCnN`) declares:

```json
"effect": {
  "type": "shadow",
  "shadowType": "outer",
  "blur": 16,
  "offset": { "x": 0, "y": 4 },
  "color": "#0000004D"
}
```

`#0000004D` is `rgba(0,0,0,0.3)`. The CSS equivalent is `box-shadow: 0 4px 16px rgba(0,0,0,0.3)`.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-input {
  ...
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

The shadow barely registers on the dark background and the input visually merges with the surface around it.

## Expected

```css
.search-input {
  ...
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

## Fix sketch

Single-line CSS change in `home.page.css`. No markup change needed.
