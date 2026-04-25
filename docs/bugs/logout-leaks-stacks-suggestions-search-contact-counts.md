# Logout leaks user A's stacks / suggestions / search results / contact counts to user B

**Flow:** 03 — User Logout
**Severity:** High (cross-user data leak in shared browser sessions; the previous fix only patched AskService and explicitly noted "the same risk applies to other root services" without addressing them)
**Status:** Complete — `StacksService`, `SuggestionsService`, `ContactsService`, and `SearchService` now each inject `AuthService` and run an `effect()` that clears their per-user signals when `authState()` becomes `null`. AuthService stays ignorant of these services (one-way dependency). New e2e `bug-logout-resets-services.spec.ts` uses SPA-only navigation across the logout boundary (so the bundle stays loaded) and asserts user A's stack chip never renders on user B's home.

## Symptom

`docs/bugs/logout-leaves-ask-history-in-memory.md` correctly fixed `AskService` to reset on logout via an `effect()` that watches `AuthService.authState`. The doc closes with:

> The same risk applies to other root services (`StacksService.stacks`, `SuggestionsService.suggestion`, etc.), but the chat is the worst offender because the content is conversational and highly personal.

That follow-up was never landed. Today, after user A logs out and user B logs in on the same browser session:

- `StacksService.stacks` still holds A's smart-stack list. Home renders A's `27 AI founders` chip until B's `home.page.ngOnInit` triggers a refresh and the signal flips.
- `SuggestionsService.suggestion` still holds A's active suggestion (`"You met 3 AI founders last week"`). Same flash.
- `ContactsService.contactCount` / `interactionCount` still hold A's counts. The hero subtitle reads `Semantic search across 47 contacts and 213 interactions` for user B until refresh resolves.
- `SearchService.results` / `query` / `contactsMatched` / `sort` still hold A's last search. If user B navigates to `/search` (e.g., via a deep link or bottom-nav), they see A's search bar populated, A's match-count meta-band, A's result rows.

All four services are `providedIn: 'root'` singletons. Their signals are never re-initialised on logout. The `home.page.ngOnInit` calls `refresh()` on stacks, suggestions, and contacts — but only after the page mounts — so the user sees a brief flash of the previous user's data. For the search service, there's no automatic reset — the stale state is sticky until the user types a new query.

## Expected

When `AuthService.authState` transitions to `null`, every root-scoped service that holds user-specific data resets its signals to their initial values. Mirrors the fix already applied to `AskService`.

Concretely, each service injects `AuthService` and runs:

```typescript
constructor(private auth: AuthService /* + http etc. */) {
  effect(() => { if (this.auth.authState() === null) this.reset(); });
}
```

Where `reset()` zeros out the user-specific signals.

## Actual

After logout, navigating around the app shows user A's data on every screen until the screen's own ngOnInit refresh resolves. SearchService never resets — the previous user's results stay rendered indefinitely.

## Repro

1. Register user A. Visit `/home` and let stacks/suggestions load.
2. Visit `/search?q=stripe`. Wait for results.
3. Log out via `/logout`.
4. Register user B (different email). Navigate to `/home`.
5. Observe: A's smart-stack chips are visible for ~200 ms before B's refresh wins.
6. Navigate to `/search`. Observe: A's last query, match count, and result rows are still rendered. Unaffected by user B's auth.

For automated repro: drive user A through the same flow, then call `auth.logout()` from the console, then check `inject(StacksService).stacks()` — still shows A's stacks. Same for the other three services.

## Notes

Radically simple fix — apply the AskService pattern to each of the four services:

- `StacksService`: inject `AuthService`, in constructor `effect(() => { if (this.auth.authState() === null) this.stacks.set([]); });`.
- `SuggestionsService`: same shape, set the suggestion signal to `null`.
- `ContactsService`: same shape, set both counts to `0`.
- `SearchService`: same shape, reset `results`, `query`, `contactsMatched`, `loading`, `error`, `sort`, `hasMore`, `page`, `loadMoreError` to their initial values. (Add a private `reset()` that zeros all of them, called from the effect.)

The AuthService stays ignorant of these services (one-way dependency), and each fix is independent.

A regression test: log a user in, populate each service (mock the relevant API), call `auth.logout()`, assert the service's user-facing signal is back to its initial value.
