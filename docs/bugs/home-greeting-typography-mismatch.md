# Home greeting typography does not match `ui-design.pen`

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Good morning, …" greeting on `/home` ships at 14px / default weight, but the design specifies 13px / weight 500. The smaller, slightly heavier cut keeps the greeting as a quiet eyebrow above the headline rather than competing with the description below.

In `docs/ui-design.pen` node `U0SNr` (frame `1. Vector Search Home` → `MXtnM/U0SNr`):

```json
{
  "fontFamily": "Inter",
  "fontSize": 13,
  "fontWeight": "500",
  "fill": "#6E6E8F"
}
```

(The `--foreground-muted` token was deliberately bumped from `#6E6E8F` to `#8E8EB5` for WCAG AA contrast — see `frontend/src/app/tokens.css` — so the colour gap is intentional and out of scope here.)

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.greeting {
  margin: 0;
  font-size: 14px;
  color: var(--foreground-muted);
}
```

No `font-weight`, so the paragraph inherits the body default (400 / normal).

## Expected

```css
.greeting {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-muted);
}
```

## Fix sketch

Two-line CSS change in `home.page.css` — bump font-size down to 13 and set font-weight to 500. Markup unchanged.
