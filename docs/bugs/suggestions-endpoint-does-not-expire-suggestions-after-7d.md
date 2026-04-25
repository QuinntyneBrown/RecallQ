# `GET /api/suggestions` never expires suggestions older than 7 days

**Flow:** 25 — Proactive AI Suggestion (Render and Dismiss)
**Severity:** Medium (a Suggestion row created 30, 60, 90 days ago and never dismissed will still be served on every home load. The user sees stale text — e.g., "You met 3 AI founder last week" — long after the underlying signal stopped being true. The detector is keyed by `(OwnerUserId, Key)` and `AnyAsync`-skips re-creation, so the row never refreshes; once the deterministic key is minted it lives in the DB until somebody dismisses it. There's no scheduled cleanup either.)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Endpoints/SuggestionsEndpoints.cs` — the GET handler:

```csharp
app.MapGet("/api/suggestions", [Authorize] async (
    AppDbContext db, ICurrentUser current, CancellationToken ct) =>
{
    var cutoff = DateTime.UtcNow.AddDays(-7);
    var row = await db.Suggestions
        .Where(s => s.DismissedAt == null || s.DismissedAt < cutoff)
        .OrderByDescending(s => s.CreatedAt)
        .FirstOrDefaultAsync(ct);
    if (row is null) return Results.Ok<object?>(null);
    return Results.Ok<object?>(new { /* ... */ });
});
```

The `Where` clause filters by `DismissedAt` only:

- `DismissedAt == null` → undismissed, always served regardless of age.
- `DismissedAt < cutoff` → dismissed but the dismissal is older than 7 days, so the key is no longer suppressed.

There is no `s.CreatedAt > cutoff` predicate. A suggestion created weeks or months ago and never dismissed continues to satisfy the first branch and is returned.

The flow's contract is explicit:

> 2. The endpoint selects the first active suggestion (**no `DismissedAt`, age < 7 d**) for the user.

"Age < 7 d" is the missing condition. The 7-day cutoff is supposed to apply to **both** the dismissal-suppression window **and** the suggestion's own freshness — they happen to be the same value, but the implementation only enforces the dismissal half.

The `SuggestionDetector` reinforces the bug because it short-circuits when a key already exists:

```csharp
if (!await db.Suggestions.IgnoreQueryFilters()
    .AnyAsync(s => s.OwnerUserId == ownerUserId && s.Key == key, ct))
{
    db.Suggestions.Add(new Suggestion { /* CreatedAt defaults to DateTime.UtcNow */ });
}
```

So a row keyed `meet-3-ai founders` written 60 days ago is never refreshed — `CreatedAt` stays at the original timestamp forever, and the GET endpoint keeps serving it.

## Expected

A suggestion with `CreatedAt` older than 7 days should not be served, even if it was never dismissed. The Where clause should AND in a `s.CreatedAt > cutoff` predicate so both halves of the flow's "active" definition are enforced:

```csharp
var cutoff = DateTime.UtcNow.AddDays(-7);
var row = await db.Suggestions
    .Where(s => s.CreatedAt > cutoff)
    .Where(s => s.DismissedAt == null || s.DismissedAt < cutoff)
    .OrderByDescending(s => s.CreatedAt)
    .FirstOrDefaultAsync(ct);
```

(Two separate Where calls is identical to a single AND in EF Core; either form is fine. The two-line form just makes the two semantic conditions visually distinct.)

## Actual

Insert a `Suggestion` row with `CreatedAt = DateTime.UtcNow.AddDays(-10)` and `DismissedAt = null`. GET `/api/suggestions` returns that row. The home page renders an "AI suggestion" card whose body text references signals from a window that closed three days ago.

## Repro

1. Register and log in as a user.
2. Insert a suggestion directly via DbContext (or the seed):
   ```csharp
   db.Suggestions.Add(new Suggestion {
       OwnerUserId = userId,
       Key = "meet-3-ai founders",
       Kind = "meet_n_tag",
       Title = "You met 3 ai founders",
       Body = "You met 3 ai founders last week — shall I find similar investors?",
       ActionLabel = "Find similar ai founders",
       ActionHref = "/search?q=ai%20founders",
       CreatedAt = DateTime.UtcNow.AddDays(-10),
   });
   ```
3. GET `/api/suggestions` with the user's cookie. The response is the inserted row, not `null`.
4. Per flow 25 step 2, the response should be `null` because `age >= 7d` makes the suggestion inactive.

## Notes

The fix is one line. The risk is also bounded: existing tests in `SuggestionsTests.cs` don't seed `CreatedAt`, so they implicitly use "now" and remain green. The new test should explicitly set `CreatedAt = now - 8 days` and assert `null`.

A separate concern (out of scope for this bug): once `meet-3-ai founders` ages out, the detector's `AnyAsync(s.Key == key)` check still finds the stale row and won't re-emit a fresh one. So the user effectively never sees that suggestion key again after the 7-day window. The cleanest follow-up would be to delete (or `IgnoreQueryFilters`-ignore) suggestions whose CreatedAt is past the cutoff so the detector can re-mint them when the signal re-fires. Filing as separate work — this bug is only about the read path.
