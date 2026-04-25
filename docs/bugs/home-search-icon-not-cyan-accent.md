# Home search icon ships in muted gray instead of the cyan accent

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The leading magnifying-glass glyph inside the home search input is rendered with `--foreground-muted` (gray) but the design paints it with the cyan brand accent.

In `docs/ui-design.pen` the reusable `Search Bar` component (`lpCnN` → child `3L91d`) sets `fill: #4BE8FF` on the leading magnifying-glass icon. That is the same cyan token defined in `frontend/src/app/tokens.css` as `--accent-tertiary`. The icon being cyan is a deliberate cue — it matches the cyan "search" iconography used elsewhere in the design system (e.g. `Search Results`) and signals the action.

Today the home search input ships the icon in muted gray, which makes it read as a neutral decoration instead of an accent.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--foreground-muted);
  font-size: 20px;
  pointer-events: none;
}
```

## Expected

```css
.search-icon {
  ...
  color: var(--accent-tertiary);
}
```

`--accent-tertiary` is `#4BE8FF`, exactly the design's `3L91d.fill`.

## Fix sketch

Single-line CSS change. Markup is fine — the icon is already a `<i class="ph ph-magnifying-glass search-icon">`.
