# All Activity page does not paginate beyond the first 50 rows

**Flow:** 12 — View Activity Timeline
**Severity:** High (data loss for high-activity contacts)
**Status:** Complete — `AllActivityPage` now tracks `nextPage` and `loadingMore` signals; an `IntersectionObserver` (`rootMargin: 200px`) observes a `<div #sentinel>` rendered after the list and calls `loadMore()` when it intersects. `loadMore()` fetches the next page, appends rows, updates `nextPage` from the server, and bails when no more pages exist. Observer is disconnected on destroy.

## Symptom

Flow 12 step 5:

> When the user scrolls within 200 px of the bottom the SPA requests
> `page=2` and appends rows.

`AllActivityPage.ngOnInit` loads page 1 with `pageSize=50` and never
reads or acts on the response's `nextPage` cursor:

```ts
const result = await this.interactions.list(id, 1, 50);
this.items.set(result.items);   // result.nextPage is ignored
```

There is no scroll listener, no IntersectionObserver, no pagination
trigger. A contact with > 50 interactions surfaces only its 50 most
recent ones in the All Activity view; the rest are unreachable from
the SPA.

## Expected

Once the user scrolls within 200 px of the bottom, the SPA fetches
the next page (using the `nextPage` value from the previous
response) and appends those rows. When the server returns
`nextPage: null` no more requests fire.

## Actual

Page 1 is loaded; subsequent pages never are. The bottom of the list
is the bottom of the data, regardless of how many interactions the
contact actually has.

## Repro

1. Create / mock a contact with > 50 interactions.
2. Visit `/contacts/:id/activity`.
3. Scroll to the bottom of the rendered list.
4. Observe: no further rows appear; only the first 50 are accessible.

## Notes

Radically simple fix:

- Track `nextPage` and `loadingMore` signals on `AllActivityPage`.
  Set `nextPage` from `result.nextPage` after the initial fetch.
- Add a `<div #sentinel>` after the list, observed by an
  `IntersectionObserver` with `rootMargin: '200px'`. When it
  intersects and there is a next page and we're not already
  loading, call `loadMore()`.
- `loadMore()` calls `interactions.list(contactId, nextPage(), 50)`,
  appends `r.items`, and updates `nextPage` from `r.nextPage`.
- Disconnect the observer in `ngOnDestroy`.
