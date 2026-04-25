# Home search placeholder uses the browser default color, not the design token

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The "Search by meaning..." placeholder relies on whatever Chromium / Firefox / Safari decide for the unstyled `::placeholder` color. The design specifies a specific muted lavender (`#6E6E8F`).

In `docs/ui-design.pen` the reusable `Search Bar` component (`lpCnN` → `l9VNc` "Search by meaning...") sets `fill: #6E6E8F`. The `--foreground-muted` token in `frontend/src/app/tokens.css` is a WCAG-bumped sibling of that hex (`#8E8EB5` instead of `#6E6E8F`); the rest of the page already uses `--foreground-muted` for the same intent (greeting, see-all caption). The home search input itself defines no `::placeholder` rule, so the placeholder paints in whatever shade the browser inherits — Chromium currently lands on a desaturated `#FFFFFF` derivative.

This is the same fix `frontend/src/app/pages/ask/ask.page.css` already applies to its input bar:

```css
.input-bar input::placeholder { color: var(--foreground-muted); }
```

## Observed

`frontend/src/app/pages/home/home.page.css` has no `::placeholder` rule under `.search-input`.

## Expected

```css
.search-input::placeholder {
  color: var(--foreground-muted);
}
```

## Fix sketch

Add the rule. No HTML change. Picks up the same WCAG-adjusted muted token the rest of the home hero uses (and which the `ask` page already uses for its sister input).
