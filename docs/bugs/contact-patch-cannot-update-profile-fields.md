# Contact PATCH cannot update editable profile fields

**Status:** Complete
**Source:** `docs/code-quality-audit.md` - High finding, "API/UI contracts are currently inconsistent"
**Flow:** [08 - Update Contact](../flows/08-update-contact/08-update-contact.md)
**Spec:** L2-008
**Severity:** High (documented editable fields cannot be persisted)

## Symptom

`PatchContactRequest` only accepts `starred`, `emails`, and `phones`:

```csharp
public record PatchContactRequest(bool? Starred, string[]? Emails, string[]? Phones);
```

`PATCH /api/contacts/{id}` only applies those three fields:

```csharp
if (req.Starred.HasValue) c.Starred = req.Starred.Value;
if (req.Emails is not null) c.Emails = req.Emails;
if (req.Phones is not null) c.Phones = req.Phones;
```

The returned `ContactDetailDto` includes profile fields such as
`displayName`, `role`, `organization`, `location`, and `tags`, but the
PATCH contract cannot update them.

## Expected

Per L2-008 and flow 08, an owner can update editable contact fields.
At minimum the PATCH contract supports:

- `displayName`
- `initials`
- `role`
- `organization`
- `location`
- `tags`
- `emails`
- `phones`
- `starred`

Any changed embedded text field (`displayName`, `role`, `organization`,
`tags`, `location`, and existing embedded email text) enqueues contact
re-embedding.

Attempts to change `id` or `ownerUserId` are ignored.

## Actual

The backend ignores profile-field updates because those properties are
not represented in `PatchContactRequest` and are never assigned in the
endpoint.

## Repro

1. Create a contact with `role = "VP"`.
2. Send `PATCH /api/contacts/{id}` with `{ "role": "CTO" }`.
3. Fetch the contact.
4. Observe `role` is still `"VP"`.

## Notes

Radically simple fix:

- Extend `PatchContactRequest` with editable profile fields.
- Apply the same trimming and length validation used by contact create.
- Enqueue an embedding job when embedded text fields change.
- Add acceptance coverage for role/tag/location updates and ignored
  immutable fields.
