# Search results page has no end-of-results marker

**Status:** Complete — `search.page.ts` now renders `<p data-testid="end-of-results">End of results</p>` below the viewport when `!hasMore() && !loading()`.
**Flow:** [17 — Search Pagination](../flows/17-search-pagination/17-search-pagination.md)
**Traces:** L1-004, L2-019.
**Severity:** Low — Flow 17 step 7 says "When `nextPage` is `null` the loader sentinel is removed and an end-of-results marker renders." Currently the SPA just stops loading; there is no indication the user has reached the end of the list, so they keep scrolling expecting more rows.

## Observed

`frontend/src/app/pages/search/search.page.ts` only renders the virtual scroll viewport and a skeleton loader. There is no template branch keyed on `!searchService.hasMore() && results().length > 0` that would surface a closing line to the visitor.

## Expected

Per Flow 17 step 7: render an end-of-results marker (e.g., the text **"End of results"** in muted secondary copy) below the last loaded row when `hasMore()` is `false`. The loader skeleton should already be hidden because `loading()` flips off after the final fetch.

## Fix sketch

In `search.page.ts`, after the `<cdk-virtual-scroll-viewport>` (still inside `@if (results().length > 0)`), add:

```html
@if (!searchService.hasMore() && !loading()) {
  <p class="end-of-results" data-testid="end-of-results">End of results</p>
}
```

with a `.end-of-results { color: var(--foreground-secondary); font-size: 13px; padding: 12px 0; text-align: center; }` rule.
