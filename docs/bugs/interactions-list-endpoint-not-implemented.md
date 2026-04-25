# `GET /api/contacts/{id}/interactions` is unimplemented — All Activity page silently shows empty

**Flow:** 12 — View Activity Timeline (and 17 — Search Pagination's infinite-scroll pattern)
**Severity:** High (the entire full-timeline view is unreachable in production: every user with > 3 interactions on a contact taps **See all N** and sees "No activity yet" instead of their interactions)
**Status:** Complete — `InteractionsEndpoints.cs` now registers `MapGet("/api/contacts/{contactId:guid}/interactions", …)` with paginated + ordered results (OccurredAt DESC, Id ASC for stability), default `pageSize = 50` capped at 100, and a `nextPage` cursor that mirrors the contacts-list endpoint. Owner-scoping comes from the global EF query filter on `Contacts` + `Interactions`. New acceptance test `InteractionsListEndpointTests` seeds 5 interactions via DbContext and asserts the live endpoint returns 200 with all 5 items + `nextPage = null`. No mocks.

## Symptom

`backend/RecallQ.Api/Endpoints/InteractionsEndpoints.cs` registers exactly three handlers:

```csharp
app.MapPost("/api/contacts/{contactId:guid}/interactions", …);   // create
app.MapPatch("/api/interactions/{id:guid}", …);                  // update
app.MapDelete("/api/interactions/{id:guid}", …);                 // delete
```

There is **no `MapGet("/api/contacts/{contactId:guid}/interactions", …)`**. The frontend, however, expects exactly that route:

```typescript
// frontend/src/app/interactions/interactions.service.ts
async list(contactId: string, page = 1, pageSize = 50): Promise<InteractionListResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(
    `/api/contacts/${contactId}/interactions?${params.toString()}`,
    { credentials: 'include' },
  );
  if (res.status !== 200) throw new Error('list_failed_' + res.status);
  return (await res.json()) as InteractionListResult;
}
```

`AllActivityPage.ngOnInit` calls `interactions.list(id, 1, 50)` and catches any thrown error by setting `items = []`:

```typescript
try {
  const result = await this.interactions.list(id, 1, 50);
  this.items.set(result.items);
  this.nextPage.set(result.nextPage);
} catch {
  this.items.set([]);
}
```

End-to-end: ASP.NET Core matches the path against the POST handler, sees the GET method is not allowed, returns **`405 Method Not Allowed`**. The frontend throws `list_failed_405`, the catch silences it, the page renders the "No activity yet" empty state — even for a contact with 50 logged interactions.

The existing e2e test that "covers" this (`bug-all-activity-page.spec.ts`) **mocks** `/api/contacts/${id}/interactions*` with `page.route(...).fulfill(...)`, so it never touches the real backend. That's why the regression slipped through and the bug doc claims "Complete" while the live API is still missing the endpoint.

The same call path is hit by `AllActivityPage.loadMore` (infinite scroll) and `AllActivityPage.onDeleteInteraction` (refetch after delete), so all three observable behaviors of the All Activity screen — initial load, scroll, post-delete refresh — are unreachable.

## Expected

`GET /api/contacts/{id:guid}/interactions?page=N&pageSize=M` exists, is `[Authorize]`, owner-scoped via the global filter, and returns:

```json
{
  "items": [InteractionDto, ...],
  "nextPage": <int|null>,
  "totalCount": <int>,
  "page": <int>,
  "pageSize": <int>
}
```

Defaults: `page = 1`, `pageSize = 50` (cap at 100). Order by `OccurredAt DESC` then `Id` for stable pagination. `nextPage` is `null` when this page returned fewer than `pageSize` rows. Owner-scoping comes from the global EF filter — a foreign-owned `contactId` returns the same shape with `items: []` (or the alternative `404`, but per flow 36 the global filter pattern is the convention; matching contacts list is `200` with items).

## Actual

`GET` requests return `405 Method Not Allowed` with `Allow: POST` because only the POST handler is registered at that path.

## Repro

1. Log in. Create a contact, log 5 interactions on it.
2. Open the contact's detail page → tap **See all 5**.
3. Observe: heading reads "All activity", body reads "No activity yet" — *not* the 5 interactions you just logged.
4. With curl: `curl -H "Cookie: rq_auth=…" http://localhost:5151/api/contacts/<id>/interactions` → `405`.

By contrast, the contact-detail page itself shows the interactions because it loads them via `GET /api/contacts/{id}` which embeds `recentInteractions` (the per-contact endpoint that *is* implemented).

## Notes

Radically simple fix in `InteractionsEndpoints.cs` — mirror the contacts-list pattern:

```csharp
app.MapGet("/api/contacts/{contactId:guid}/interactions", [Authorize] async (
    Guid contactId, AppDbContext db, int? page, int? pageSize) =>
{
    var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == contactId);
    if (contact is null) return Results.NotFound();
    var p = page is null or < 1 ? 1 : page.Value;
    var ps = pageSize is null or < 1 ? 50 : Math.Min(pageSize.Value, 100);
    var query = db.Interactions
        .Where(i => i.ContactId == contactId)
        .OrderByDescending(i => i.OccurredAt)
        .ThenBy(i => i.Id);
    var totalCount = await query.CountAsync();
    var rows = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();
    var items = rows.Select(InteractionDto.From).ToArray();
    var nextPage = totalCount > p * ps ? p + 1 : (int?)null;
    return Results.Ok(new { items, totalCount, page = p, pageSize = ps, nextPage });
});
```

The global owner-scope filter on `Contacts` and `Interactions` makes `contactId` foreign-owner-safe. A real e2e or acceptance test should hit the live backend (no mock) so future regressions don't slip past — exactly the pattern I added in iteration 4 for the missing `DELETE /api/contacts/{id}` endpoint.
