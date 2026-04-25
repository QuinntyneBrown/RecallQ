# Delete contact silently fails — backend has no DELETE endpoint

**Flow:** 09 — Delete Contact (Cascade)
**Severity:** High (the entire flow 09 cascade — interactions, embeddings, summary — is unreachable; the Delete-contact button is decorative)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` registers `MapPost`, `MapGet`, `MapPatch`, and the list/count GETs — but **no `MapDelete("/api/contacts/{id:guid}", …)` handler exists**. Searching the entire backend confirms there is exactly one `MapDelete` (interactions only):

```text
backend/RecallQ.Api/Endpoints/InteractionsEndpoints.cs:72:        app.MapDelete("/api/interactions/{id:guid}", [Authorize] async (
```

The frontend, meanwhile, fully wires the delete:

```typescript
// frontend/src/app/contacts/contacts.service.ts
async delete(id: string): Promise<void> {
  const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE', credentials: 'include' });
  if (res.status !== 204 && res.status !== 200) {
    throw new Error('delete_failed_' + res.status);
  }
}
```

```typescript
// frontend/src/app/pages/contact-detail/contact-detail.page.ts
async deleteContact() {
  const c = this.contact();
  if (!c) return;
  if (!window.confirm('Delete this contact? This cannot be undone.')) return;
  try {
    await this.contacts.delete(c.id);
    this.toast.show('Contact deleted');
    await this.router.navigateByUrl('/home');
  } catch {
    this.toast.show('Could not delete contact');
  }
}
```

End-to-end, the user taps the trash icon, confirms `Delete this contact? This cannot be undone.`, sees the **`Could not delete contact`** toast, and the contact is **still there** on reload. The cascade flow specified in `docs/flows/09-delete-contact/09-delete-contact.md` (relationship summary, interaction embeddings, interactions, contact embedding, contact — inside one transaction, then `204 No Content`) is unreachable.

The reason this slipped past CI is that `e2e/tests/bug-delete-contact.spec.ts` mocks the DELETE response with `route.fulfill({ status: 204 })`, so the test never touches the real backend.

## Expected

`DELETE /api/contacts/{id:guid}` exists, is `[Authorize]`, and:

1. Loads the contact owner-scoped (the global `OwnerScope` filter handles this — non-owner ⇒ `null` ⇒ `404`).
2. Inside one `IDbContextTransaction`, removes the cached relationship summary, the interaction embeddings for the contact's interactions, the interactions themselves, the contact embedding, and the contact.
3. Commits and returns `204 No Content`.
4. Invalidates `StackCountCache.InvalidateOwner(userId)` so the next stacks fetch recomputes counts (parity with the create endpoint).

EF Core cascades on `Contact` already cover `Interaction`, `ContactEmbedding`, `RelationshipSummary` via `OnDelete(DeleteBehavior.Cascade)` configured in `AppDbContext.OnModelCreating`. `InteractionEmbedding` cascades from its `Interaction` parent. So a `Contacts.Remove(c) + SaveChangesAsync()` is sufficient for the cascade — the explicit per-table removes the flow describes are belt-and-suspenders.

## Actual

`DELETE /api/contacts/{id}` falls through ASP.NET routing → `404` (or `405` with `Allow: GET, PATCH` depending on the routing match). The frontend's `delete()` throws `delete_failed_404`, which the page surfaces as `Could not delete contact`. The contact remains in the database, with all its interactions and embeddings intact.

## Repro

1. Log in.
2. Create a contact, e.g. "Doomed".
3. From the contact detail page, tap the trash icon.
4. Confirm the modal.
5. Observe the toast: `Could not delete contact`.
6. Navigate to `/home` and reload — "Doomed" is still in the contacts list.
7. With curl: `curl -i -X DELETE http://localhost:5000/api/contacts/<id> -b cookie.txt` → `404`.

## Notes

Radically simple fix — add the missing endpoint and call the existing `StackCountCache.InvalidateOwner` to mirror the create path. EF Core's configured cascades take care of the related-row cleanup:

```csharp
app.MapDelete("/api/contacts/{id:guid}", [Authorize] async (
    Guid id, AppDbContext db, ICurrentUser current, StackCountCache stackCache) =>
{
    var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
    if (c is null) return Results.NotFound();
    db.Contacts.Remove(c);
    await db.SaveChangesAsync();
    stackCache.InvalidateOwner(current.UserId!.Value);
    return Results.NoContent();
});
```

A real (non-mocked) e2e test should:

1. Register, log in.
2. POST a contact.
3. DELETE it via the API.
4. Assert the response is `204`.
5. GET the contact and assert `404`.

This guarantees future regressions can't hide behind mocked routes.
