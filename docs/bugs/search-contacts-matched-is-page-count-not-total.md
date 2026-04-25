# Search contactsMatched returns the page row count, not the total

**Flow:** 15 — Vector Semantic Search (meta-band "N contacts matched")
**Severity:** High (visible undercount on every multi-page search)
**Status:** Complete — `SearchRow` gained a `long TotalMatches` field; the search SQL appends `COUNT(*) OVER () AS "TotalMatches"` to the outer `SELECT`, and the response derives `contactsMatched` from `rows[0].TotalMatches` (or `0` when empty), so the meta-band reflects the real total across pages.

## Symptom

`backend/RecallQ.Api/Endpoints/SearchEndpoints.cs`:

```csharp
var rows = await db.Database.SqlQueryRaw<SearchRow>(sql, …).ToListAsync();
…
return Results.Ok(new {
    results = mapped,
    nextPage = rows.Count == pageSize ? page + 1 : (int?)null,
    contactsMatched = rows.Count
});
```

The SPA renders this in the meta-band:

```ts
readonly matchCountLabel = computed(() => {
  const n = this.contactsMatched();
  return n === 1 ? '1 contact matched' : `${n} contacts matched`;
});
```

But `rows.Count` is the size of the current page (≤ pageSize, default
50). For a user with 200 matched contacts, page 1 returns 50, so the
SPA shows `50 contacts matched`. After paginating to page 2, the SPA
keeps showing `50` (the SPA only reads `contactsMatched` on the
initial search, not on `loadMore`).

So users with large match sets see a permanent **undercount** of
their results — `50 contacts matched` when they actually have ~200,
exactly the kind of "feels broken" stat that erodes trust.

## Expected

`contactsMatched` is the count of distinct contacts in the
`collapsed` CTE, *before* `LIMIT`/`OFFSET`. Page 1 of a 200-match
search returns `contactsMatched: 200`, page 2 also `200`, and so on.

## Actual

`contactsMatched = rows.Count` — i.e. the per-page row count, capped
at pageSize.

## Repro

1. Index ~60 contacts whose embeddings would all match a generic
   query (simplest with the test `BagOfWordsEmbeddingClient`).
2. POST `/api/search { q: "anything", page: 1, pageSize: 50 }`.
3. Observe response `contactsMatched: 50` even though the dataset
   has ~60 matches and `nextPage: 2` is set.

## Notes

Radically simple fix:

- Add a `long TotalMatches` field to the `SearchRow` record.
- Append `, COUNT(*) OVER () AS "TotalMatches"` to the outer
  `SELECT` in the raw SQL CTE.
- Replace `contactsMatched = rows.Count` with
  `contactsMatched = rows.Count == 0 ? 0 : (int)rows[0].TotalMatches`.
- The window-function count is computed in-engine on the post-
  collapse rows, so no second round-trip is needed.
