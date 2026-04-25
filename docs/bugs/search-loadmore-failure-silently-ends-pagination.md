# Search loadMore failure silently ends pagination

**Flow:** 17 — Search Pagination (Infinite Scroll)
**Severity:** High
**Status:** Complete — `SearchService` now exposes a `loadMoreError` signal; non-200 / thrown fetch in `loadMore` sets it without touching `hasMore`. `search.page.html` renders a `Couldn't load more — Retry` chip (`data-testid="loadmore-retry"`) when the error signal is set, and only renders the `End of results` marker when the server actually said `nextPage: null`.

## Symptom

`SearchService.loadMore` swallows any non-200 response by setting
`hasMore = false`:

```ts
if (res.status === 200) {
  // append
} else {
  this.hasMore.set(false);   // <— wrong on transient failures
}
```

In the search page that triggers the "End of results" marker:

```html
@if (!searchService.hasMore() && !loading()) {
  <p class="end-of-results" data-testid="end-of-results">End of results</p>
}
```

So a transient `429`/`500`/`503` while paginating tells the user *they have
seen everything*, when in reality the server just hiccuped and additional
pages still exist. There is also no retry affordance in the UI.

## Expected (per flow 17)

> **Network failure** → show a retry chip, do not clear existing rows.

- The previously loaded rows stay rendered.
- `hasMore` is **not** flipped to `false` by a transient error.
- A "Couldn't load more — Retry" chip is shown beneath the list, and
  activating it re-runs `loadMore` for the same page number.
- The "End of results" marker appears only when the server actually says
  `nextPage: null`.

## Actual

- Non-200 → `hasMore` flipped to `false`.
- "End of results" marker renders.
- No retry chip; user is stuck with whatever rows had loaded so far.

## Repro

1. Trigger a search that yields more than one page (e.g., mock the first
   `POST /api/search` to return `nextPage: 2`).
2. Make the second `POST /api/search` (page 2) return `500`.
3. Observe: "End of results" appears below the list, and there's no way to
   retry the failed page short of refreshing the whole search.

## Notes

Radically simple fix:

- Add a `loadMoreError` signal to `SearchService`.
- On non-200 in `loadMore`, leave `hasMore` alone and set
  `loadMoreError = true`.
- Render a `Couldn't load more — Retry` chip with `data-testid="loadmore-retry"`
  whenever `loadMoreError() && !loading()`. Clicking it clears the error
  and calls `loadMore()` again.
