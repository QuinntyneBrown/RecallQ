# Score chip is 28px tall with 12px text, design says 24/11

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The score-chip on result cards renders 4px taller and a step heavier than the design specifies.

In `docs/ui-design.pen` each score tier (`0QZrm` / `lzlpQ` / `fiEpD`) declares:

```json
{ "height": 24, "padding": [0, 10], "cornerRadius": 999 }
```

with the value text:

```json
{ "fontFamily": "Geist Mono", "fontSize": 11, "fontWeight": "600" }
```

## Observed

`frontend/src/app/ui/score-chip/score-chip.component.css`:

```css
.chip {
  ...
  height: 28px;
  min-width: 48px;
  padding: 0 10px;
  ...
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  ...
}
```

## Expected

```css
.chip {
  ...
  height: 24px;
  min-width: 48px;
  padding: 0 10px;
  ...
  font-size: 11px;
  font-weight: 600;
  ...
}
```

## Fix sketch

Two-line change. Min-width and padding stay; only height and font-size come down.
