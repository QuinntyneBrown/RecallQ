# `owed_replies` suggestion's primary action routes to a non-existent `/contacts?filter=owed`

**Flow:** 25 — Proactive AI Suggestion (Render and Dismiss)
**Severity:** Medium-High (every user who has ≥ 2 unreplied emails older than 7 days sees this suggestion; tapping the only call-to-action it offers — "Triage" — silently bounces them to `/login`)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Suggestions/SuggestionDetector.cs` emits the `owed_replies` suggestion with a hardcoded `ActionHref`:

```csharp
db.Suggestions.Add(new Suggestion
{
    OwnerUserId = ownerUserId,
    Key = key,
    Kind = "owed_replies",
    Title = $"{owed} possible unreplied emails",
    Body  = $"You have {owed} possible unreplied emails — want to triage them?",
    ActionLabel = "Triage",
    ActionHref  = "/contacts?filter=owed",
});
```

The frontend `SuggestionCardComponent.nav()` does:

```typescript
nav(e: Event): void {
  e.preventDefault();
  void this.router.navigateByUrl(this.suggestion.actionHref);
}
```

But `frontend/src/app/app.routes.ts` has **no** `/contacts` route (only `/contacts/new`, `/contacts/:id`, and nested children). The wildcard catches the navigation:

```typescript
{ path: '**', redirectTo: 'login' },
```

So an authenticated user who taps **Triage** is silently sent to `/login`. They land on a Sign-in form they don't need to fill out, with nothing telling them why or how to recover. The only feedback that anything happened is the URL change and the page swap.

The other two suggestion kinds work:

- `meet_n_tag` → `ActionHref = "/search?q={tag}"` — `/search` is a real route ✓
- `silent_warm` → `ActionHref = "/contacts/{contactId}"` — `/contacts/:id` is a real route ✓

Only `owed_replies` is broken.

## Expected

The `owed_replies` suggestion's primary action either:

1. Routes to an existing screen that lists "owed reply" contacts, or
2. Falls back to a route that already filters/searches contacts by something the user can act on.

Concretely, the simplest existing destination is a search query the user can refine — e.g., `"/search?q=email"` or `"/search?sort=recent"`. None of the existing routes filters on "interaction type = email AND age > 7 days", but the search page is at least a sensible landing where the user can act, instead of being booted to login.

## Actual

`router.navigateByUrl("/contacts?filter=owed")` → wildcard match → `/login` redirect. The user re-enters the login form they're already authenticated against.

## Repro

1. Log a contact with 2+ email interactions older than 7 days. Wait for `SuggestionDetector` to tick (or call its hosted-service trigger).
2. Open `/home`. Observe the **AI suggestion** card with title "2 possible unreplied emails" and a **Triage** primary action.
3. Tap **Triage**.
4. Observe the URL becomes `/login` (the wildcard's redirect target). The user is dropped on the Sign-in form despite still being authenticated.

## Notes

Radically simple fix in `SuggestionDetector.DetectOnceAsync`, no new route, no template changes:

```csharp
ActionLabel = "Triage",
ActionHref  = "/search?sort=recent",
```

(Or `"/contacts"`-routed once a "list all" page exists; today's `/home` already shows recently-active contacts via stacks but isn't a clean "owed" filter either.) The `/search?sort=recent` lands on the search page with the recent-first sort, where the user can immediately type a query or see their roster — strictly better than redirecting to login.

A regression test: the suggestion's `actionHref`, when navigated, must not land on `/login`.
