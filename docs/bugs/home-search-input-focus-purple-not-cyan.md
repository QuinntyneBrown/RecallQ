# Home search input focus paints purple, not cyan

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The home search pill flips its border to `--accent-primary` purple on focus, while the global `:focus-visible` rule paints a cyan outline (`--accent-tertiary`). Same composition gap the input-field component had before `input-field-focus-mixes-purple-with-global-cyan.md` was patched — this one is the page-local copy.

The design (`docs/ui-design.pen` Search Bar `lpCnN`) does not specify a focus state, but the project's design system standardises focus on cyan (per the T031 WCAG AA bump in `tokens.css` / `styles.css`). Every other focusable surface in the app routes through `--accent-tertiary`; this single rule breaks the pattern.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-input:focus {
  border-color: var(--accent-primary);
}
```

## Expected

```css
.search-input:focus {
  border-color: var(--accent-tertiary);
}
```

## Fix sketch

One-token swap. No HTML or component change. Cyan border-on-focus now layers cleanly with the global cyan outline.
