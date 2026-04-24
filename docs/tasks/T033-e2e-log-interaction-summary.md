# T033 — E2E Major Flow: Log Interaction → Summary Refreshes

| | |
|---|---|
| **Slice** | Integration of slices 05, 14 |
| **L2 traces** | L2-010, L2-011, L2-031, L2-033 |
| **Prerequisites** | T009, T010, T019 |
| **Produces UI** | Yes |

## Objective

Prove the interaction→summary feedback loop. Given an existing contact, the user logs a new interaction, returns to the detail screen, and observes the relationship summary regenerate with the updated stats.

## Scope

**In:**
- One spec `tests/T033-log-interaction-summary.spec.ts`.
- Screenshots before and after the interaction + summary refresh.

## ATDD workflow

1. **Red — e2e**:
   - Seed one contact via API.
   - Wait for the initial summary to generate.
   - Capture `T033-1-before.png` at detail.
   - Log a new `call` interaction via UI with distinctive text.
   - Return to detail; poll for updated `Interactions` count and `Since last` = `< 1 hour`.
   - Capture `T033-2-after.png`.
2. **Green** — all assertions pass.

## Playwright POM

Use `ContactDetailPage`, `AddInteractionPage`. Compose into `flows/log-interaction.flow.ts` for re-use.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] No sleeps. Polling uses `expect.poll(...).toPass(...)`.
- [ ] The spec does not manipulate the DB directly to simulate the summary.

## Screenshots

- `T033-1-before.png`
- `T033-2-after.png`

## Definition of Done

- [x] Spec green consistently.
- [x] Three verification passes complete clean.

**Status: Complete**
