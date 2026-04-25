# Search loadmore-retry button hover paints purple, project accent is cyan

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Load more" / "Retry" pill on the search page tints `--accent-primary` purple on hover. Like every other interactive accent recently swept onto cyan, this should match `--accent-tertiary`.

## Observed

`frontend/src/app/pages/search/search.page.css`:

```css
.loadmore-retry:hover, .loadmore-retry:focus-visible {
  background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-elevated));
  border-color: var(--accent-primary);
}
```

## Expected

```css
.loadmore-retry:hover, .loadmore-retry:focus-visible {
  background: color-mix(in srgb, var(--accent-tertiary) 12%, var(--surface-elevated));
  border-color: var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap.
