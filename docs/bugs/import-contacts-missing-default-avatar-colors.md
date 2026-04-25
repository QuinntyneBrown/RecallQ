# CSV-imported contacts have null avatar colors instead of palette defaults

**Flow:** 31 — CSV Bulk Import
**Severity:** Medium-high (every contact created via the bulk-import path lands in the DB with `avatar_color_a = NULL` and `avatar_color_b = NULL`. The list view, detail header, search results, and ask citations all read these columns to render the gradient avatar; with both null, the avatar fallback path is taken and the contact looks visually distinct from contacts created one-by-one through `POST /api/contacts`. This is the same hash-from-displayName palette assignment that `create-contact-missing-default-avatar-colors.md` already fixed for the single-create path — the import path was just never updated.)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` — the POST handler computes defaults from the display name when the client omits the colors:

```csharp
var colorPalette = new[] { "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2" };
var nameHash = displayName.GetHashCode();
var defaultColorA = colorPalette[Math.Abs(nameHash) % colorPalette.Length];
var defaultColorB = colorPalette[Math.Abs(nameHash + 1) % colorPalette.Length];

var contact = new Contact
{
    // …
    AvatarColorA = req.AvatarColorA ?? defaultColorA,
    AvatarColorB = req.AvatarColorB ?? defaultColorB,
};
```

`backend/RecallQ.Api/Endpoints/ImportContactsMap.cs` — the import path builds the Contact without touching the color columns:

```csharp
contact = new Contact
{
    OwnerUserId = ownerId,
    DisplayName = displayName,
    Initials = DeriveInitials(displayName),
    Role = string.IsNullOrWhiteSpace(row.Role) ? null : row.Role.Trim(),
    Organization = string.IsNullOrWhiteSpace(row.Organization) ? null : row.Organization.Trim(),
    Location = string.IsNullOrWhiteSpace(row.Location) ? null : row.Location.Trim(),
    Tags = tags,
    Emails = emails,
    Phones = phones,
    // (AvatarColorA, AvatarColorB never set → both null)
};
```

The CSV format (per flow 31 step 1) doesn't carry `avatarColorA`/`avatarColorB` columns, so the import path is the *only* path through which a user could end up with null defaults. The single-create path always derives them.

## Expected

Imported contacts get the same palette defaults as POST-created ones — same algorithm, same palette — so the UI is consistent regardless of which path created the contact.

The simplest move is to extract the palette/derivation into one place and call it from both handlers. Inline duplication of two lines into `TryBuildContact` is fine for a one-shot fix; refactoring can come later.

## Actual

After a CSV import, query the contacts in Postgres:

```
SELECT display_name, avatar_color_a, avatar_color_b FROM contacts ORDER BY created_at DESC LIMIT 5;
```

Imported rows show `NULL, NULL` for the color columns. Contacts created via the SPA's "Add contact" form show `#85C1E2, #FFA07A` (or whatever the hash maps to).

In the UI, the Contact list, contact detail hero, search result avatar, and ask-citation avatar all branch on whether color A and B are non-null. With both null, the components fall back to a flat surface color or a neutral gradient — a contact with a real gradient sits next to a contact with a flat fallback, and the visual treatment changes mid-list as the user scrolls past the seam between manually-added and bulk-imported contacts.

## Repro

1. Register a user, log in.
2. POST a CSV with one row to `/api/import/contacts`:
   ```csv
   displayName,role,organization,emails,phones,tags,location
   Alice,Engineer,Acme,alice@acme.com,,,
   ```
3. GET `/api/contacts/{aliceId}` and observe `"avatarColorA": null, "avatarColorB": null` in the response payload.
4. Compare with a contact created via `POST /api/contacts {"displayName":"Bob","initials":"BO"}` — that response includes non-null hex colors.

## Notes

The single-create fix lives at `ContactsEndpoints.cs:43-46, 59-60`. Lifting those four lines into a helper (or duplicating them inline in `TryBuildContact`) is the radically simple fix. The palette list is the source of truth and can stay in `ContactsEndpoints.cs` for now — extracting later is fine.

Adding a regression test: create a contact via `POST /api/import/contacts` with a one-row CSV, then GET the resulting contact and assert `avatarColorA` and `avatarColorB` are non-null hex strings.

This is the same class of bug as the previously-fixed `create-contact-missing-default-avatar-colors.md`, just on the import-path twin that was missed.
