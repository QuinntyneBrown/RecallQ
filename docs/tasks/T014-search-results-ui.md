# T014 — Search Results UI

| | |
|---|---|
| **Slice** | [09 Search results UI](../detailed-designs/09-search-results-ui/README.md) |
| **L2 traces** | L2-016, L2-017, L2-020, L2-082 |
| **Prerequisites** | T013 |
| **Produces UI** | Yes |

## Objective

Ship the `SearchResultsPage` matching screen `2. Search Results`. Renders the query chip, meta band, featured result card (with "WHY THIS MATCH"), standard result cards, and score tiers (High / Mid / Low matching `Score High`/`Mid`/`Low`).

## Scope

**In:**
- `SearchResultsPage` at `/search?q=…` (or `?stackId=…`, but stacks land in T020).
- `FeaturedResultCard`, `ResultCard`, `ScoreChip`, `InteractionPills`, `QueryChip`, `ZeroState` components in `web/src/app/ui/`.
- Tap on a result navigates to `/contacts/:id`.

**Out:**
- Sort / infinite scroll (T015).

## ATDD workflow

1. **Red — unit**:
   - `ScoreChip_shows_high_variant_at_0_96` (L2-017).
   - `ScoreChip_shows_mid_at_0_87` (L2-017).
   - `ScoreChip_shows_low_at_0_62` (L2-017).
2. **Red — e2e**:
   - `T014-search.spec.ts` — register + seed 3 contacts with known interaction text → perform `POST /api/search` via UI (type in home search bar, press Enter) → assert featured card, one standard card, score tiers, and matched-text truncation.
   - Zero-state spec: with no contacts, search for `"foo"`, assert zero-state renders.
3. **Green** — implement components + page.

## Playwright POM

`pages/search-results.page.ts`:
```ts
export class SearchResultsPage {
  constructor(private page: Page) {}
  async gotoQuery(q: string) { await this.page.goto(`/search?q=${encodeURIComponent(q)}`); }
  queryChipText() { return this.page.getByTestId('query-chip').innerText(); }
  matchedCount()  { return this.page.getByTestId('match-count').innerText(); }
  featured()      { return this.page.getByTestId('featured-result'); }
  standardCards() { return this.page.getByTestId('result-card'); }
  zeroState()     { return this.page.getByTestId('zero-state'); }
}
```

Add `flows/search.flow.ts` that does `HomePage → type query → press Enter → return SearchResultsPage`.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Result cards render via shared components, not bespoke divs per page.
- [ ] Featured card border stroke comes from `#7C3AFF77` token literal referenced through a CSS variable (not hard-coded in 12 places).
- [ ] Matched-text truncation happens once, server-side — the client never trims.

## Screenshot

`docs/tasks/screenshots/T014-search-results.png` — results page at 375×667 with a purple-bordered featured card and 2 standard cards below.

## Definition of Done

- [ ] 3 unit tests + 2 e2e specs pass.
- [ ] Tapping a result navigates to `/contacts/:id`.
- [ ] Three verification passes complete clean.
