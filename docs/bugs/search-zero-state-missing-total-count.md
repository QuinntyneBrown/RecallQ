# POST /api/search returns inconsistent field names in response

**Status:** Complete
**Source:** Flow 18 - Search Zero-State E2E tests
**Severity:** Medium (inconsistent response structure)

## Symptom

The search endpoint returns different field names for result count:
- Returns `contactsMatched` for non-empty results
- Returns `contactsMatched` for empty results
- Does not include `page` or `pageSize` fields in response
- Field naming inconsistent with flow 18 expected response structure

## Expected

Per flow 18, the search endpoint should return a consistent response structure:
```json
{
  "results": [...],
  "totalCount": 42,
  "page": 1,
  "pageSize": 50,
  "nextPage": 2
}
```

## Actual

Endpoint returns:
```json
{
  "results": [...],
  "contactsMatched": 42,
  "nextPage": 2
}
```

## Repro

1. Create a user and login
2. POST `/api/search` with any query
3. Observe response uses `contactsMatched` instead of `totalCount`
4. Observe response missing `page` and `pageSize` fields

## Notes

The search endpoint needs to:
- Rename `contactsMatched` to `totalCount` for consistency with flow 18 spec
- Include `page` field in response
- Include `pageSize` field in response  
- Return consistent structure for both empty and non-empty results
