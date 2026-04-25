# Sort menu chip font is 13px, design says 11

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The sort/similarity dropdown chip on `/search` paints its label at 13px. The design's sort button (`BQz5F` → `0Evpx`) declares Inter 11/500 — a tighter cut so the chip reads as a quiet control next to the "24 contacts matched" meta line above it.

In `docs/ui-design.pen` the sort button label:

```json
{ "content": "Similarity", "fontFamily": "Inter", "fontSize": 11, "fontWeight": "500" }
```

## Observed

`frontend/src/app/ui/sort-menu/sort-menu.component.css`:

```css
.chip {
  ...
  font-size: 13px;
  ...
}
```

## Expected

```css
.chip {
  ...
  font-size: 11px;
  font-weight: 500;
  ...
}
```

## Fix sketch

Two-property change. Adds the design's font-weight 500 in the same step.
