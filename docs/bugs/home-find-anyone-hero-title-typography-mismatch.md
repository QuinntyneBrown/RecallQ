# Home `Find anyone.` hero title typography does not match `ui-design.pen`

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The hero title on `/home` ships at a smaller size, lighter weight, looser line-height, and zero letter-spacing compared to the design.

In `docs/ui-design.pen` node `F2ZYi` (frame `1. Vector Search Home` → `MXtnM/TizXT`), `Find anyone.` is rendered with `fontFamily: Geist`, `fontSize: 34`, `fontWeight: 700`, `letterSpacing: -1.2`, `lineHeight: 1.05`. The `By meaning, not memory.` line directly underneath shares the exact same scale (just recoloured with a gradient — see also `home-by-meaning-subtitle-missing-gradient.md`). Implementation regresses both typographic dimensions:

- font-size 32 instead of 34
- font-weight 600 instead of 700
- letter-spacing 0 instead of -1.2px (-0.035em)
- line-height 1.1 instead of 1.05

The two-line title block is the brand statement — the design intentionally uses a tighter, heavier, slightly larger cut so it reads as a confident headline rather than a body lede.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.hero-title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
}
```

## Expected

```css
.hero-title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -1.2px;
}
```

## Fix sketch

Update `.hero-title` to the four design values. No HTML change required — the `<h1 id="hero-title">` markup already exists.
