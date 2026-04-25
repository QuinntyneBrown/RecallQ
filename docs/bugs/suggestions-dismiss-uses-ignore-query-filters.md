# Suggestions dismiss endpoint uses IgnoreQueryFilters in handler code

**Flow:** 36 — Owner-Scope Data Isolation
**Severity:** Medium (defense-in-depth violation; brittle isolation)
**Status:** Open

## Symptom

Flow 36 alternative line 41:

> **Filter escape hatch** (`IgnoreQueryFilters`) is never used in
> handler code. It is reserved for explicit admin utilities.

`backend/RecallQ.Api/Endpoints/SuggestionsEndpoints.cs`:

```csharp
app.MapPost("/api/suggestions/{key}/dismiss", [Authorize] async (
    string key, AppDbContext db, ICurrentUser current, CancellationToken ct) =>
{
    var ownerId = current.UserId!.Value;
    var row = await db.Suggestions.IgnoreQueryFilters()
        .FirstOrDefaultAsync(s => s.OwnerUserId == ownerId && s.Key == key, ct);
    …
});
```

This is a request-scoped endpoint handler. The global query filter
on `Suggestion` (`s => s.OwnerUserId == ctx.CurrentUser.UserId`)
already restricts every read to the authenticated user, so:

- The `IgnoreQueryFilters()` call disables that safety net.
- The manual `s.OwnerUserId == ownerId` predicate has to put the
  safety net back, by hand.

If a future edit drops the manual `OwnerUserId == ownerId` clause
(e.g., during a refactor that "looks safe"), cross-user data leaks
through this endpoint. The flow specifically calls this pattern out
as forbidden — the whole point of the global filter is that handler
code cannot accidentally leak by missing a filter, but
`IgnoreQueryFilters()` reintroduces exactly that risk.

`CrossUserIsolationTests.Cross_user_suggestion_dismiss_returns_404`
covers behaviour today thanks to the manual predicate; the bug is
that the endpoint relies on a hand-written predicate instead of the
declarative filter.

## Expected

The dismiss handler reads through the unfiltered DbSet and lets the
global query filter scope the row to the current user:

```csharp
var row = await db.Suggestions.FirstOrDefaultAsync(s => s.Key == key, ct);
if (row is null) return Results.NotFound();
row.DismissedAt = DateTime.UtcNow;
…
```

## Actual

`IgnoreQueryFilters()` + manual owner predicate.

## Repro

1. `grep -n "IgnoreQueryFilters" backend/RecallQ.Api/Endpoints/`.
2. `SuggestionsEndpoints.cs:32` matches inside a `MapPost` handler.

## Notes

Radically simple fix: remove the `IgnoreQueryFilters()` call and the
manual `s.OwnerUserId == ownerId` clause from the predicate. The
existing `CrossUserIsolationTests.Cross_user_suggestion_dismiss_returns_404`
test continues to pass — and now genuinely exercises the global
filter rather than the hand-written predicate.
