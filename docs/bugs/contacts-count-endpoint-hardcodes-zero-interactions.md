# /api/contacts/count returns hardcoded 0 interactions

**Flow:** 06 — List Contacts (home subtitle)
**Severity:** High (visible wrong stat on every home render)
**Status:** Complete — `ContactsEndpoints.cs` now runs `await db.Interactions.CountAsync()` and returns the actual user-scoped count instead of `0`. The owner-scope global query filter already restricts the count to the authenticated user.

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs`:

```csharp
app.MapGet("/api/contacts/count", [Authorize] async (AppDbContext db) =>
{
    var contacts = await db.Contacts.CountAsync();
    return Results.Ok(new { contacts, interactions = 0 });   // <— always 0
});
```

The home page's hero subtitle reads:

```
Semantic search across N contacts and M interactions.
```

`M` always renders as `0` because the endpoint never queries
`db.Interactions`. Even for users with hundreds of logged
interactions, the subtitle says "and 0 interactions". The wrong
stat is shown to every authenticated user immediately on
authentication.

## Expected

`/api/contacts/count` returns the actual interaction count for the
authenticated user:

```csharp
var interactions = await db.Interactions.CountAsync();
return Results.Ok(new { contacts, interactions });
```

The global owner-scope filter already restricts the query.

## Actual

`interactions = 0` is a literal in the response body.

## Repro

1. Register or sign in.
2. Create at least one contact and log at least one interaction
   (via the SPA or directly via the API).
3. Open `/home`.
4. Subtitle reads `… and 0 interactions.` no matter what.

## Notes

Radically simple fix: replace `interactions = 0` with `interactions
= await db.Interactions.CountAsync()`.
