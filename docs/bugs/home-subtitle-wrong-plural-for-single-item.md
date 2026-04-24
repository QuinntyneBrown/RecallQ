# Home hero subtitle uses plural nouns even when count is 1

**Status:** Complete — a `heroSubtitle` computed in `home.page.ts` now pluralises `contact`/`interaction` based on each count.
**Flow:** [06 — List Contacts](../flows/06-list-contacts/06-list-contacts.md)
**Traces:** L1-002, L2-009.
**Severity:** Medium — the hero subtitle is the most prominent sentence on the app's landing screen; after a user adds their first contact it reads "1 contacts and 0 interactions", which looks unpolished and breaks trust that the team pays attention to copy.

## Observed

`frontend/src/app/pages/home/home.page.ts` binds the counts with a bare interpolation:

```html
<p class="hero-subtitle" data-testid="hero-subtitle">
  Semantic search across {{ contactCount() }} contacts and {{ interactionCount() }} interactions.
</p>
```

Result when either count is exactly `1`:

- `1 contacts and 0 interactions` (right after the first create)
- `1 contacts and 1 interactions` (right after the first logged interaction)

## Expected

Noun should agree with its count:

- `0` → `0 contacts`, `0 interactions`
- `1` → `1 contact`, `1 interaction`
- `≥ 2` → `N contacts`, `N interactions`

This matches Flow 06 step 5: "the SPA binds `totalCount` into the hero subtitle" — the binding must produce grammatical English regardless of count.

## Fix sketch

Replace the inline `{{ contactCount() }} contacts` with a `computed()` signal that pluralises `contact`/`interaction` based on the count, and bind the whole sentence via `{{ heroSubtitle() }}`.
