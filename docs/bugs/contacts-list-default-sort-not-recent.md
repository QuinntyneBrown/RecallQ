# GET /api/contacts default sort is createdAt_desc, not recent

**Flow:** 06 — List Contacts
**Severity:** Medium-High (default surfaces wrong contacts)
**Status:** Open

## Symptom

Flow 06 step 3:

> Default sort is `recent` (most recently interacted). `sort=name`
> orders case-insensitive by `displayName`.

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs`:

```csharp
query = (sort ?? "createdAt_desc") switch
{
    "createdAt_asc" => query.OrderBy(c => c.CreatedAt),
    "name_asc" => query.OrderBy(c => c.DisplayName),
    "name_desc" => query.OrderByDescending(c => c.DisplayName),
    _ => query.OrderByDescending(c => c.CreatedAt),
};
```

The default key is `createdAt_desc` (most recently *created*). Per
the flow it should be `recent` (most recently *interacted*) — which
is the genuinely useful CRM default. A user opening a contacts list
expects the people they've actually been talking to recently to
surface first, not the people they typed into the form most
recently.

There is also no branch for the spec's `recent` key, so a client
explicitly opting in to it gets the implicit fallback (currently
`createdAt_desc`).

## Expected

- Default and explicit `recent` order by
  `COALESCE(MAX(interactions.occurredAt), contacts.createdAt) DESC`.
- `createdAt_asc` / `createdAt_desc` / `name_asc` / `name_desc`
  remain available as explicit overrides.

## Actual

Default falls through to `createdAt_desc`. There is no `recent`
case.

## Repro

1. Create contact A and contact B in that order.
2. Log an interaction on A with `occurredAt` in the future
   (e.g., 2099-01-01).
3. `GET /api/contacts` — expect `items[0]` = A (its interaction is
   the latest signal). Observe `items[0]` = B (the most recently
   created contact).

## Notes

Radically simple fix: change the default key from `createdAt_desc`
to `recent` and add an explicit `recent` branch:

```csharp
_ => query.OrderByDescending(c =>
    db.Interactions.Where(i => i.ContactId == c.Id).Max(i => (DateTime?)i.OccurredAt) ?? c.CreatedAt)
```

The global query filter on `Interaction` keeps the correlated
sub-query owner-scoped automatically.
