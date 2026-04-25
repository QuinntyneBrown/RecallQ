# Stacks `/contacts` endpoint returns all rows with no pagination

**Flow:** 24 — Smart Stacks (View and Open)
**Severity:** Medium (wire-contract gap, unbounded result set)
**Status:** Complete — `GET /api/stacks/{id}/contacts` now reads `page` / `pageSize` query string parameters (defaults 1 / 50, max page size 100), pages the member query with `Skip`/`Take`, and returns `{ items, totalCount, page, pageSize, nextPage }` matching `/api/contacts`. The dead-branch ternary on the previous ordering line has been collapsed into a single `OrderByDescending(c => c.CreatedAt)` call. The unreferenced `listContacts` helper in `frontend/src/app/stacks/stacks.service.ts` was left untouched.

## Symptom

Flow 24 step 3:

> The SPA calls `GET /api/stacks/:id/contacts?page=1&pageSize=50`.
> Server returns the contacts for that stack (paginated like
> search results).

`backend/RecallQ.Api/Endpoints/StacksEndpoints.cs`:

```csharp
app.MapGet("/api/stacks/{id:guid}/contacts", [Authorize] async (
    Guid id, AppDbContext db, StackCountCalculator calc, CancellationToken ct) =>
{
    var stack = await db.Stacks.FirstOrDefaultAsync(s => s.Id == id, ct);
    if (stack is null) return Results.NotFound();
    var query = calc.BuildMemberQuery(stack);
    query = stack.Kind == StackKind.Classification
        ? query.OrderByDescending(c => c.CreatedAt)
        : query.OrderByDescending(c => c.CreatedAt);
    var rows = await query.ToListAsync(ct);
    return Results.Ok(rows.Select(ContactsEndpoints.ContactDto.From).ToArray());
});
```

The endpoint accepts no `page` / `pageSize` query parameters,
materialises the full member query into a list, and returns a
flat array. A user with a `vip` tag covering 5 000 contacts gets
all 5 000 rows in one response — the opposite of what the flow
specifies, and an unbounded payload risk.

The `/api/contacts` listing endpoint already implements the
documented shape:

```csharp
var nextPage = totalCount > p * ps ? p + 1 : (int?)null;
return Results.Ok(new { items, totalCount, page = p, pageSize = ps, nextPage });
```

`/api/stacks/{id}/contacts` should match.

## Expected

```
GET /api/stacks/{id}/contacts?page=1&pageSize=50
200 OK
{
  "items": [...],
  "totalCount": <int>,
  "page": 1,
  "pageSize": 50,
  "nextPage": 2 | null
}
```

- `pageSize` defaults to 50 (per the flow), capped at 100.
- `page` defaults to 1, minimum 1.
- `nextPage` is the next page index when more rows remain, else
  `null`.

## Actual

```
GET /api/stacks/{id}/contacts
200 OK
[ { ...contact... }, { ...contact... }, ... all rows ... ]
```

No pagination metadata, no envelope, all members in one response.

## Repro

1. Insert a Tag stack with definition `vip` for the user.
2. Create 60 contacts, all tagged `vip`.
3. `GET /api/stacks/{id}/contacts` — observe a 60-element JSON
   array. There is no way to ask for only the first page.

## Notes

The fix mirrors `/api/contacts` exactly: read `page` / `pageSize`
query string params, clamp them, page the IQueryable with
`Skip/Take`, and return the same envelope. The existing
`listContacts` helper in `frontend/src/app/stacks/stacks.service.ts`
is unreferenced, so changing the response shape does not affect the
SPA today.

The `OrderByDescending(c => c.CreatedAt)` ternary in the current
code has identical branches; the simplest fix collapses it to a
single `OrderByDescending(c => c.CreatedAt)` call before paging.
