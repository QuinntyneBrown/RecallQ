# Home search input font-size does not match `ui-design.pen`

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The home search input ships at 16px but the design specifies 15px for both the typed value and the placeholder, which keeps the hero typography a clean step down from the 14px description above and 34px headline.

In `docs/ui-design.pen` the reusable `Search Bar` component (`lpCnN` → child `l9VNc` "Search by meaning...") sets `fontFamily: Inter`, `fontSize: 15`, `fontWeight: normal`, `fill: #6E6E8F`. The CSS rule for the input itself has no `font-size`, so the placeholder inherits it from the input's value font-size; the input is currently `16px`.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-input {
  ...
  font-size: 16px;
  ...
}
```

## Expected

```css
.search-input {
  ...
  font-size: 15px;
  ...
}
```

## Fix sketch

Single-line CSS change. Markup is untouched. The native browser placeholder picks the same 15px from the input's font-size — the design does not require a separate `::placeholder` rule.
