# Search page error banner uses purple tint, not red

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The search results error banner paints a `--accent-secondary` brand-magenta-tint background. The design's error language across the app uses red (`#FF6B6B14` background under `#FFB3B3` text — see Add Contact validation patterns under frame `e9D7e`).

## Observed

`frontend/src/app/pages/search/search.page.css`:

```css
.error {
  background: color-mix(in srgb, var(--accent-secondary) 15%, transparent);
  color: var(--foreground-primary);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
}
```

## Expected

```css
.error {
  background: color-mix(in srgb, #FF6B6B 15%, transparent);
  color: #FFB3B3;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
}
```

## Fix sketch

Two literal swaps. Banner now reads as a failure (red) instead of a brand accent (magenta).
