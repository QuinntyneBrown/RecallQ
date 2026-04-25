# /api/import/contacts returns 200 OK instead of 201 Created

**Flow:** 31 — CSV Bulk Import
**Severity:** Low (contract gap)
**Status:** Open

## Symptom

Flow 31 step 7:

> The endpoint returns `201 Created` with `{ imported, failed,
> errors: [...] }`.

`backend/RecallQ.Api/Endpoints/ImportEndpoints.cs`:

```csharp
return Results.Ok(new { imported, failed, errors });
```

The handler returns `200 OK` rather than the spec-mandated
`201 Created`. Most clients treat the two as equivalent for the
"resource created" semantic, but consumers that branch on the exact
status (an SDK retry policy, an integration test asserting a created
resource) silently mishandle the response.

## Expected

Successful import → `201 Created` with the same JSON body
(`{ imported, failed, errors }`).

## Actual

`200 OK`.

## Repro

1. POST `/api/import/contacts` with a one-row CSV.
2. Inspect the response status: `200`.

## Notes

Radically simple fix: switch `Results.Ok(...)` to
`Results.Json(payload, statusCode: StatusCodes.Status201Created)`.
The SPA's `ImportsService.upload` already accepts any 2xx as
success (`if (!res.ok) throw …`), so the user-visible behaviour is
unchanged.
