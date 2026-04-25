# SearchEndpoints uses IgnoreQueryFilters in handler code

**Flow:** 36 — Owner-Scope Data Isolation
**Severity:** Medium (defense-in-depth violation; brittle isolation)
**Status:** Complete — `SearchEndpoints` now reads `db.ContactEmbeddings.CountAsync()` / `db.ContactEmbeddings.CountAsync(e => e.Model == client.Model)` (and the parallel `InteractionEmbeddings` counts) directly. The four `IgnoreQueryFilters().Where(e => e.OwnerUserId == userId)` chains are gone — owner scope flows from the global query filter exactly the way flow 36 designed it.

## Symptom

Flow 36 alternative line:

> **Filter escape hatch** (`IgnoreQueryFilters`) is never used in
> handler code. It is reserved for explicit admin utilities.

`backend/RecallQ.Api/Endpoints/SearchEndpoints.cs` lines 46–49
(inside the request handler):

```csharp
var ceTotal = await db.ContactEmbeddings.IgnoreQueryFilters().Where(e => e.OwnerUserId == userId).CountAsync();
var ceMatch = await db.ContactEmbeddings.IgnoreQueryFilters().Where(e => e.OwnerUserId == userId && e.Model == client.Model).CountAsync();
var ieTotal = await db.InteractionEmbeddings.IgnoreQueryFilters().Where(e => e.OwnerUserId == userId).CountAsync();
var ieMatch = await db.InteractionEmbeddings.IgnoreQueryFilters().Where(e => e.OwnerUserId == userId && e.Model == client.Model).CountAsync();
```

Same anti-pattern as the recently fixed
`SuggestionsEndpoints.dismiss`: the request-scoped handler bypasses
the global query filter and re-implements owner scoping by hand.
The global filter on `ContactEmbedding` and `InteractionEmbedding`
already scopes to the current user, so the manual
`Where(e => e.OwnerUserId == userId)` clauses are redundant — and
if a future edit drops one of them, the handler silently leaks
counts across users.

`CrossUserIsolationTests.Cross_user_search_only_returns_caller_contacts`
covers behaviour today via the manual predicate; the bug is that
search relies on hand-written predicates instead of the declarative
filter the flow was designed around.

## Expected

The four count queries collapse to:

```csharp
var ceTotal = await db.ContactEmbeddings.CountAsync();
var ceMatch = await db.ContactEmbeddings.CountAsync(e => e.Model == client.Model);
var ieTotal = await db.InteractionEmbeddings.CountAsync();
var ieMatch = await db.InteractionEmbeddings.CountAsync(e => e.Model == client.Model);
```

The global filter handles owner scoping; the only remaining
predicate is the model-name match for the model-mismatch check.

## Actual

`IgnoreQueryFilters()` + manual `OwnerUserId == userId` predicate
in four places.

## Repro

1. `grep -n "IgnoreQueryFilters" backend/RecallQ.Api/Endpoints/SearchEndpoints.cs`.
2. Four matches inside a request handler.

## Notes

Radically simple fix: drop the `.IgnoreQueryFilters()` call and the
`e.OwnerUserId == userId` predicate from each of the four count
queries. The existing CrossUserIsolation tests continue to pass and
the handler stops reaching past the safety net.
