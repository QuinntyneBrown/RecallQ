# T021 — Proactive Suggestion Card

| | |
|---|---|
| **Slice** | [16 Proactive suggestion](../detailed-designs/16-proactive-suggestion/README.md) |
| **L2 traces** | L2-029, L2-030 |
| **Prerequisites** | T020 |
| **Produces UI** | Yes |

## Objective

Detect proactive suggestion signals and render the gradient-filled `AI SUGGESTION` card on home with a primary action (navigates) and a `Dismiss` action (suppresses 7 days).

## Scope

**In:**
- `Suggestion` entity + migration.
- `SuggestionDetector : BackgroundService` running daily, applying 3 heuristics (`meet-N-tag`, `owed-replies`, `silent-warm`).
- `GET /api/suggestions` returns up to 1 active undismissed.
- `POST /api/suggestions/{key}/dismiss`.
- `SuggestionCard` component matching `Cm94Y`.

**Out:**
- LLM-generated suggestion copy — purely heuristic in v1.

## ATDD workflow

1. **Red — API**:
   - `Detector_emits_meet_N_when_threshold_met` (L2-029).
   - `No_signal_yields_no_suggestion_home_hides_card` (L2-029).
   - `Dismiss_suppresses_same_key_for_7_days` (L2-030).
   - `Different_key_still_eligible_after_dismiss` (L2-030).
2. **Red — e2e**:
   - `T021-suggestion.spec.ts` — seed interactions that trigger `meet-3-ai-founders`, run detector, reload home, assert card present; tap primary, assert navigation; reload home, tap Dismiss, assert card hidden; reload again, assert still hidden.
3. **Green** — implement detector + endpoints + card.

## Playwright POM

Extend `HomePage`:
```ts
suggestionCard()    { return this.page.getByTestId('suggestion-card'); }
async tapSuggestionPrimary() { return this.suggestionCard().getByRole('link').click(); }
async tapSuggestionDismiss() { return this.suggestionCard().getByRole('button', { name: 'Dismiss' }).click(); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The gradient fill uses the 3-stop design gradient as a single CSS `linear-gradient`.
- [ ] The pulsing dot respects `prefers-reduced-motion` (see T031).
- [ ] The suggestion card is hidden via `*ngIf="suggestion()"`, not CSS — DOM accurately reflects presence for accessibility tests.

## Screenshot

`docs/tasks/screenshots/T021-suggestion.png` — Home page at 375×667 with the gradient AI suggestion card visible.

## Definition of Done

- [ ] 4 API tests + 1 e2e pass.
- [ ] Three verification passes complete clean.
