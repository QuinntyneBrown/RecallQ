# GET /api/contacts response missing nextPage field

**Flow:** 06 — List Contacts
**Severity:** Medium (contract gap; blocks paged consumers)
**Status:** Open

## Symptom

Flow 06 step 4:

> The response is `{ items: ContactDto[], totalCount, nextPage }`.

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs`:

```csharp
return Results.Ok(new { items, totalCount, page = p, pageSize = ps });
```

The endpoint returns `page` and `pageSize` (not in the spec) and
omits `nextPage` entirely. Any paged consumer (search results-style
infinite scroll for the contacts list, an admin list, the upcoming
ContactsListPage) has to derive it from `totalCount > page * pageSize`
on its own — which is exactly the kind of derivation the spec
chose to centralise on the server.

The SPA's `ContactListResult` interface mirrors the buggy server
shape today (`page`, `pageSize`, no `nextPage`), so the contract
gap is consistent end-to-end — but neither side matches the spec.

## Expected

```json
{ "items": [...], "totalCount": 137, "nextPage": 2 }
```

When the consumer is on the last page, `nextPage` is `null`.

## Actual

```json
{ "items": [...], "totalCount": 137, "page": 1, "pageSize": 20 }
```

## Repro

1. Sign in.
2. Create at least 3 contacts.
3. `GET /api/contacts?pageSize=2&page=1` → response includes `page`
   and `pageSize` but no `nextPage`.

## Notes

Radically simple fix: change the return to also emit
`nextPage = totalCount > p * ps ? p + 1 : (int?)null`. Keep the
existing `page` / `pageSize` fields for backwards compatibility
with the SPA's current `ContactListResult` interface — they aren't
in the flow spec but stripping them would break the existing
typing.
