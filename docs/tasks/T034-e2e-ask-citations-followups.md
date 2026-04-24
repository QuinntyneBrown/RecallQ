# T034 — E2E Major Flow: Ask Mode with Citations + Follow-ups

| | |
|---|---|
| **Slice** | Integration of slices 11, 12, 13 |
| **L2 traces** | L2-021, L2-022, L2-023, L2-024 |
| **Prerequisites** | T016, T017, T018 |
| **Produces UI** | Yes |

## Objective

Verify the full Ask experience end-to-end: streaming tokens, citation mini-cards, follow-up chips, and that tapping a follow-up chip generates a second answer.

## Scope

**In:**
- One spec `tests/T034-ask-full.spec.ts` orchestrating `AskModePage`.
- Uses `FakeChatClient` via an API-level switch (test-only header or environment variable `RECALLQ_LLM=fake`).

## ATDD workflow

1. **Red — e2e**:
   - Seed 3 contacts.
   - Open `/ask`.
   - Type `who should I talk to about a Series B?` and send.
   - Assert assistant bubble streams content.
   - Assert 3 citation cards appear.
   - Assert 3 follow-up chips appear.
   - Tap citation #1 → assert navigation to `/contacts/:id` → back to `/ask`.
   - Tap follow-up chip #2 → assert a second user bubble and second answer.
   - Capture `T034-ask.png` mid-flow and `T034-ask-2.png` after the second exchange.
2. **Green** — assertions pass.

## Playwright POM

Uses `AskModePage`. No additions required.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Spec exercises at least two user messages to verify session retention per L2-025.
- [ ] Streaming is verified by observing the assistant bubble text grow across polling intervals — not just by checking final text.

## Screenshots

- `T034-ask.png`
- `T034-ask-2.png`

## Definition of Done

- [ ] Spec green consistently.
- [ ] Three verification passes complete clean.
