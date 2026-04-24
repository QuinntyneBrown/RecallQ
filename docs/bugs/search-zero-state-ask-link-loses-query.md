# Search zero-state "Ask mode" link does not seed the current query

**Status:** Complete — `ZeroStateComponent` now takes a `q` input, renders "No matches yet" / "Ask RecallQ", and `search.page.ts` forwards the live query so the Ask link routes to `/ask?q=<query>`.
**Flow:** [18 — Search Zero-Result State](../flows/18-search-zero-state/18-search-zero-state.md)
**Traces:** L1-004, L1-005, L2-014.
**Severity:** Medium-High — a visitor who just typed a query and hit zero matches taps the one suggested handoff and lands on a blank `/ask`. They must retype their question, breaking the flow Flow 18 step 4 is designed to preserve.

## Observed

`frontend/src/app/ui/zero-state/zero-state.component.ts` is a stateless component with a bare `routerLink="/ask"`:

```html
<i class="ph ph-magnifying-glass icon" aria-hidden="true"></i>
<h2 class="head">No contacts matched</h2>
<p class="body">Try a different query or open Ask mode.</p>
<a routerLink="/ask" class="link">Open Ask mode</a>
```

No `q` input is accepted; the parent `SearchResultsPage` never forwards `this.q()` into the panel; the anchor has no `queryParams` binding. Tapping the link from `/search?q=Q2%20investors` lands on `/ask` with an empty prompt.

The heading and body also diverge from Flow 18 step 3 (expected `No matches yet` and "the query did not match indexed contacts or interactions").

## Expected

Per Flow 18 step 4: "If the user taps `Ask RecallQ` the SPA navigates to `/ask?q={query}` where the input is pre-seeded and auto-focused."

The zero-state panel should:

- Accept the current query as an input.
- Render `Ask RecallQ` (primary) with `routerLink="/ask"` + `queryParams="{ q }"`.
- Render `No matches yet` as the heading and the spec-defined body copy.

`/ask` already reads `?q` and pre-seeds the input (see `ask.page.ts`).

## Fix sketch

1. Add a `q` `@Input` to `ZeroStateComponent`.
2. Change the anchor to `[routerLink]="['/ask']" [queryParams]="{ q }"` and update the label to `Ask RecallQ`.
3. Update the heading to `No matches yet` and the body to match the Flow 18 wording.
4. Pass `[q]="q()"` from `search.page.ts` when rendering `<app-zero-state>`.
