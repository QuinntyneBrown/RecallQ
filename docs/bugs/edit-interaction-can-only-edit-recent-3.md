# Edit Interaction page can only load the 3 most recent interactions

**Flow:** 13 — Update Interaction (and 12 — View Activity Timeline as the entry point)
**Severity:** High (editing silently fails for any interaction beyond the most recent 3 — including every interaction reached from the All Activity page once the contact has > 3 interactions)
**Status:** Complete — `ContactsService.get` now takes an optional `take`, and `EditInteractionPage` calls it with `take=50` so the server returns up to the maximum number of interactions instead of the default 3. E2E test `bug-edit-interaction-beyond-recent-3.spec.ts` provisions a contact with 4 interactions and asserts the oldest hydrates correctly. Contacts with > 50 interactions are out of scope for this fix; the cleaner long-term move is a dedicated `GET /api/interactions/{id}`.

## Symptom

`frontend/src/app/pages/edit-interaction/edit-interaction.page.ts` hydrates the form like this:

```typescript
async ngOnInit(): Promise<void> {
  const contactId = this.route.snapshot.paramMap.get('id');
  const interactionId = this.route.snapshot.paramMap.get('interactionId');
  if (!contactId || !interactionId) return;
  const contact = await this.contacts.get(contactId);
  const i = contact?.recentInteractions?.find(r => r.id === interactionId);
  if (!i) {
    this.error.set("We couldn't find that interaction.");
    this.loaded.set(true);
    return;
  }
  this.type.set(i.type);
  // …
}
```

The page resolves the target interaction by **searching `contact.recentInteractions`**, but that collection is capped server-side. From `backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs`:

```csharp
app.MapGet("/api/contacts/{id:guid}", [Authorize] async (Guid id, AppDbContext db, int? take) =>
{
    // …
    var n = take is null or < 1 ? 3 : Math.Min(take.Value, 50);
    // …
});
```

The frontend `ContactsService.get(id)` does **not** pass `take`, so the default `n = 3` applies. The contact detail response therefore contains only the 3 most recent interactions, regardless of how many the contact actually has.

`AllActivityPage.onEditInteraction` (the See-all-activity page) emits a navigate to `/contacts/:id/interactions/:interactionId/edit`. That route loads the same edit page — which then tries to find a 4th-, 5th- or 73rd-most-recent interaction inside a 3-item collection and always fails with `"We couldn't find that interaction."`

## Expected

The Edit Interaction page can hydrate the form for **any** interaction the user owns, regardless of its position in the timeline.

Concretely, given a contact with 4+ interactions, navigating to the edit URL of the oldest one must:

1. Load that interaction's `type`, `subject`, `occurredAt`, and `content` into the form.
2. Allow the user to save edits.

No error message should be shown for valid, owner-scoped interactions.

## Actual

For any interaction beyond the 3 most recent, `ngOnInit` sets the error `"We couldn't find that interaction."` and renders no form fields — the page is unusable. Save is unreachable.

This silently breaks the All Activity → Edit path the moment a contact accumulates a 4th interaction. The Contact Detail page itself is unaffected, because it only shows links for the 3 it already has loaded.

## Repro

1. Log in.
2. Create a contact and log 4 interactions on it (or seed via `POST /api/contacts/{id}/interactions` four times).
3. Open `/contacts/{id}/activity` → see the full list (4 items).
4. Click the kebab → Edit on the **oldest** interaction.
5. Observe: the page renders only the heading "Edit Interaction" and an inline error `"We couldn't find that interaction."`. No form fields appear.

For interactions in the most-recent 3, the page works fine — which makes the bug intermittent and easy to miss in QA.

## Notes

The architectural fix is to add `GET /api/interactions/{id:guid}` and have the edit page hydrate from that endpoint. That's the right long-term move — the edit page shouldn't need a contact-shaped response just to load one row.

Radically simple short-term fix that resolves the symptom and matches the existing API surface: tell the edit page to fetch up to the server-side cap (`take=50`). The contacts GET already supports this and the frontend `ContactsService.get` only needs an optional argument:

```typescript
async get(id: string, take?: number): Promise<ContactDetailDto | null> {
  const url = take ? `/api/contacts/${id}?take=${take}` : `/api/contacts/${id}`;
  const res = await fetch(url, { credentials: 'include' });
  // …
}
```

Then in the edit page:

```typescript
const contact = await this.contacts.get(contactId, 50);
```

This makes the path work for any contact with up to 50 interactions, which is the same cap the timeline page already operates under. Contacts with > 50 interactions are out of scope for this fix; the longer-term `GET /api/interactions/{id}` endpoint is the correct follow-up.
