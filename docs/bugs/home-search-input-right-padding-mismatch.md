# Home search input right padding is 24px instead of 18px

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The home search input pads its right edge at 24px but the design `Search Bar` (`lpCnN`) uses 18px symmetrically, leaving the typed text slightly more cramped on the right than necessary.

In `docs/ui-design.pen` the reusable `Search Bar` component:

```json
{ "id": "lpCnN", "name": "Search Bar", "padding": [0, 18] }
```

`padding: [0, 18]` resolves to 0 vertical and 18 horizontal — both left and right pad at 18px. The implementation hard-codes asymmetric padding `0 24px 0 52px`. The 52 left is correct (it makes room for the absolutely-positioned icon: 18 + 20 icon + 12 gap + 2 buffer ≈ 52) but the 24 right has no design basis — it ships 6px wider than spec.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.search-input {
  ...
  padding: 0 24px 0 52px;
}
```

## Expected

```css
.search-input {
  ...
  padding: 0 18px 0 52px;
}
```

## Fix sketch

One-line CSS change. No HTML or component change.
