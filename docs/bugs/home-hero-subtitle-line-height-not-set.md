# Home `.hero-subtitle` line-height does not match `ui-design.pen`

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Semantic search across X contacts and Y interactions." description currently inherits the browser-default `normal` line-height, so when the count grows large enough to wrap, the second line lands at a tighter rhythm than the design intends.

In `docs/ui-design.pen` node `iLRLS` (frame `1. Vector Search Home` → `MXtnM/iLRLS`):

```json
{
  "fontFamily": "Inter",
  "fontSize": 14,
  "fontWeight": "normal",
  "fill": "#B8B8D4",
  "lineHeight": 1.45
}
```

`1.45 × 14 = 20.3px`. The implementation does not set `line-height` on `.hero-subtitle`, so it inherits the browser default (`normal`, which Chromium resolves to ~16.8px — about 1.2 — for Inter).

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.hero-subtitle {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--foreground-secondary);
}
```

## Expected

```css
.hero-subtitle {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--foreground-secondary);
}
```

## Fix sketch

One-line CSS addition. No HTML change. Unitless `1.45` matches the design value exactly.
