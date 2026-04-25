# POST /api/search does not return totalCount for zero results

**Status:** Incomplete
**Source:** Flow 18 - Search Zero-State E2E tests
**Severity:** Medium (inconsistent response structure for empty results)

## Symptom

When a search query returns no matches, the `POST /api/search` endpoint returns an empty `results` array, but the `totalCount` field is missing or undefined instead of being 0.

## Expected

Per flow 18, the search endpoint should return a consistent response structure even when results are empty:
```json
{
  "results": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 50,
  "nextPage": null
}
```

## Actual

Response is missing or has `undefined` for `totalCount`:
```json
{
  "results": [],
  "totalCount": undefined,  // or missing entirely
  "page": 1,
  "pageSize": 50,
  "nextPage": null
}
```

## Repro

1. Create a user and login
2. POST `/api/search` with a query that matches nothing (e.g., "nonexistentquery")
3. Observe that `totalCount` is undefined or missing in response

## Notes

The search endpoint needs to:
- Always include `totalCount` field in response
- Set `totalCount` to 0 when results are empty
- Maintain consistent response structure across all result counts
- Return `nextPage: null` when there are no results
