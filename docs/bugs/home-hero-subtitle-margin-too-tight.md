# Home `.hero-subtitle` sits 8px under the headline row instead of 14px

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Semantic search across X contacts and Y interactions." description sits too close to the gradient line above it, narrowing the rhythm the design hero relies on.

In `docs/ui-design.pen` the hero column (`MXtnM`) lays its three children — greeting, heroTitleRow, description — out vertically with `gap: 14`. The companion fix `home-greeting-to-headline-gap-too-tight.md` already restored the 14px gap above the headline; this bug captures the matching gap below it.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.hero-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--foreground-secondary);
}
```

## Expected

```css
.hero-subtitle {
  margin: 14px 0 0;
  ...
}
```

## Fix sketch

One-line CSS bump from 8 → 14. Markup unchanged. Together with the headline's `margin-top: 14`, this completes the design's hero column rhythm.
