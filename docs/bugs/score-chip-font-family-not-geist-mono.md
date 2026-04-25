# Score chip text inherits Inter, design says Geist Mono

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The score-chip declares no `font-family` so the value inherits the body Inter stack. The design specifies Geist Mono — a fixed-width display monospace that pairs the chip with the design's other Geist Mono captions ("AI SUGGESTION", "FOLLOW-UP", "IMPORTED").

In `docs/ui-design.pen` each score tier value (`lSR2w` / `OCPYG` / `Xxj8H`) declares:

```json
{ "fontFamily": "Geist Mono", "fontSize": 11, "fontWeight": "600" }
```

## Observed

`frontend/src/app/ui/score-chip/score-chip.component.css`:

```css
.chip {
  ...
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  ...
}
```

No `font-family`. `font-variant-numeric: tabular-nums` is the implementation's stand-in for the monospace look but the typeface itself is still Inter.

## Expected

```css
.chip {
  ...
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  ...
}
```

## Fix sketch

One-line CSS addition. Mirrors the `.eyebrow` rules elsewhere in the codebase that already lead with `'Geist Mono'`.
