# Contact delete route is missing while the SPA calls it

**Status:** Complete
**Source:** `docs/code-quality-audit.md` - High finding, "API/UI contracts are currently inconsistent"
**Flow:** [09 - Delete Contact (Cascade)](../flows/09-delete-contact/09-delete-contact.md)
**Severity:** High (delete-contact UI cannot succeed)

## Symptom

`frontend/src/app/contacts/contacts.service.ts` exposes a delete method
that calls the contact endpoint:

```ts
async delete(id: string): Promise<void> {
  const res = await fetch(`/api/contacts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  ...
}
```

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` maps POST, GET,
PATCH, list, and count routes, but does not map
`DELETE /api/contacts/{id}`.

## Expected

Per flow 09, confirming contact deletion sends
`DELETE /api/contacts/{id}`. The backend deletes the owner-scoped
contact, cascades dependent records, and returns a successful response
such as `204 No Content`.

Non-owners receive `404 Not Found`.

## Actual

The SPA issues a `DELETE` request to a route the API does not define.
The request returns 404/405 instead of deleting the contact.

## Repro

1. Sign in and open any contact detail page.
2. Trigger the delete-contact action and confirm.
3. Observe the network request to `DELETE /api/contacts/{id}` does not
   hit a mapped backend endpoint.

## Notes

Radically simple fix:

- Add `app.MapDelete("/api/contacts/{id:guid}", ...)`.
- Load the owner-scoped contact through `AppDbContext`.
- Remove it and save changes.
- Invalidate any per-owner stack/contact caches affected by deletion.
- Add an acceptance test for owner success and non-owner 404.
