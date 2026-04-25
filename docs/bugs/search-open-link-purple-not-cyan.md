# Search detail "Open full profile" link paints purple, not cyan

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Open full profile" link in the search detail pane tints `--accent-primary` purple. Every other interactive link in the app — home Smart-stacks see-all, contact-detail see-all, sidebar/bottom-nav active state — has been brought onto cyan `--accent-tertiary` in recent fixes; this is the last surviving copy on the search surface.

## Observed

`frontend/src/app/pages/search/search.page.css`:

```css
.open-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
```

## Expected

```css
.open-link {
  color: var(--accent-tertiary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
```

## Fix sketch

One-token swap.
