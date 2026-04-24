# T019 — Relationship Summary

| | |
|---|---|
| **Slice** | [14 Relationship summary](../detailed-designs/14-relationship-summary/README.md) |
| **L2 traces** | L2-031, L2-032, L2-033 |
| **Prerequisites** | T010, T011, T016 |
| **Produces UI** | Yes |

## Objective

Compute and display a per-contact AI summary with `Paragraph`, `Sentiment` (Warm/Neutral/Cool), `InteractionCount`, and `LastInteractionAt`. Refreshable (rate-limited 1/60s) and auto-invalidated when an interaction changes.

## Scope

**In:**
- `RelationshipSummary` entity + migration.
- `Channel<SummaryRefreshJob>` + `SummaryWorker : BackgroundService`.
- `GET /api/contacts/{id}/summary` returning cached summary or placeholder.
- `POST /api/contacts/{id}/summary:refresh` (rate-limited).
- `RelationshipSummaryCard` component replacing the placeholder on contact detail.

**Out:**
- Admin metrics of summary regeneration.

## ATDD workflow

1. **Red — API**:
   - `Summary_for_contact_with_interactions_returns_paragraph_and_stats` (L2-031).
   - `Summary_for_contact_with_no_interactions_shows_not_enough_data` (L2-031).
   - `Refresh_twice_in_60s_429` (L2-032).
   - `Cached_summary_within_1h_does_not_call_LLM` (L2-032).
   - `New_interaction_invalidates_summary_and_regenerates` (L2-033).
2. **Red — e2e**:
   - `T019-summary.spec.ts` — seed contact + 3 interactions, open detail, assert summary paragraph + Warm sentiment + `3 days` stat.
3. **Green** — implement entity + worker + endpoints + card.

## Playwright POM

Extend `ContactDetailPage`:
```ts
summaryParagraph() { return this.page.getByTestId('summary-paragraph'); }
statInteractions() { return this.page.getByTestId('stat-interactions'); }
statSentiment()    { return this.page.getByTestId('stat-sentiment'); }
statSinceLast()    { return this.page.getByTestId('stat-since-last'); }
async tapRefreshSummary() { await this.page.getByRole('button', { name: 'Refresh summary' }).click(); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The worker loads at most 20 recent interactions and truncates each to 400 chars before prompting.
- [ ] Card matches `aiSummary` / `GwZQR` layout exactly (stat band at bottom, paragraph above).
- [ ] Sentiment colors: Warm → `var(--success)`, Neutral → `var(--foreground-primary)`, Cool → `var(--accent-tertiary)`.

## Screenshot

`docs/tasks/screenshots/T019-summary.png` — contact detail at 375×667 with an AI summary card and stat band visible.

## Definition of Done

- [x] 5 API tests + 1 e2e pass.
- [x] Three verification passes complete clean.

**Status: Complete**
