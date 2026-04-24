# T015 — Search Sort + Infinite Scroll

| | |
|---|---|
| **Slice** | [10 Search sort and pagination](../detailed-designs/10-search-sort-pagination/README.md) |
| **L2 traces** | L2-018, L2-019, L2-062 |
| **Prerequisites** | T014 |
| **Produces UI** | Yes |

## Objective

Add the sort toggle (`Similarity` / `Most recent`) and CDK virtual-scroll infinite scrolling to the results page. The list DOM is capped at ~80 cards regardless of total results.

## Scope

**In:**
- Sort popover component on results page.
- `@angular/cdk/scrolling` + `cdk-virtual-scroll-viewport` + `*cdkVirtualFor`.
- Auto-fetch the next page when scrolling within 200px of the bottom.
- Skeleton loader when `loading()` is true.

**Out:**
- Sort across multi-pane layouts (LG/XL — T027).

## ATDD workflow

1. **Red — unit**:
   - `Sort_toggle_default_is_similarity` (L2-018).
   - `Toggle_to_recency_reorders_rows` (L2-018).
   - `Sort_change_preserves_match_count` (L2-018).
2. **Red — e2e**:
   - `T015-sort-paginate.spec.ts` — seed 120 contacts (via `seed-api.ts`), issue query that matches all, assert 50 rows rendered, scroll to bottom, assert up to next 50 appended, assert DOM card count ≤ 80.
3. **Green** — implement.

## Playwright POM

Extend `SearchResultsPage`:
```ts
async pickSort(label: 'Similarity' | 'Most recent') {
  await this.page.getByRole('button', { name: 'Sort' }).click();
  await this.page.getByRole('menuitem', { name: label }).click();
}
async scrollToBottom() {
  await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}
async domCardCount() {
  return this.page.getByTestId('result-card').count();
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `cdk-virtual-scroll-viewport` is the only source of virtualization — no custom virtualization code.
- [ ] Loading state is expressed as a signal, not a BehaviorSubject.

## Screenshot

`docs/tasks/screenshots/T015-sort-paginate.png` — results page mid-scroll with the sort popover open.

## Definition of Done

- [ ] 3 unit tests + 1 e2e pass.
- [ ] `domCardCount()` ≤ 80 when total = 120.
- [ ] Three verification passes complete clean.
