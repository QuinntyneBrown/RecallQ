# T018 — Ask Follow-up Chips

| | |
|---|---|
| **Slice** | [13 Ask follow-ups](../detailed-designs/13-ask-followups/README.md) |
| **L2 traces** | L2-024 |
| **Prerequisites** | T016 |
| **Produces UI** | Yes |

## Objective

After the answer stream, emit a `followups` SSE event carrying up to 3 strings from a secondary LLM call and render them as pill chips. Tapping a chip submits it as the next user question.

## Scope

**In:**
- Secondary `IChatClient.CompleteAsync` call in `AskEndpoints` producing a JSON array of 0–3 strings.
- `FollowUpChip` component matching `fu1`/`fu2`/`fu3`.
- Silent failure mode: if the LLM responds with invalid JSON, emit zero chips.

**Out:**
- Follow-up configurability UI.

## ATDD workflow

1. **Red — API**:
   - `Followups_event_emitted_with_list` (L2-024).
   - `Invalid_followup_json_yields_zero_chips` (L2-024).
2. **Red — e2e**:
   - `T018-followups.spec.ts` — ask a question → assert 3 chips appear under `FOLLOW-UP` label → tap chip #2 → assert a new user bubble with chip text.
3. **Green** — implement server event + parser + component.

## Playwright POM

Extend `AskModePage`:
```ts
followUps() { return this.page.getByTestId('follow-up-chip'); }
async tapFollowUp(n: number) { await this.followUps().nth(n).click(); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Follow-up chips are rendered with `layout:"wrap"` semantics (CSS `flex-wrap: wrap`) so 0–3 chips flow cleanly.
- [ ] Cost guard: follow-up prompt capped at 60 tokens in, 40 out (checked via a `TokenCountingChatClient` decorator in tests).

## Screenshot

`docs/tasks/screenshots/T018-followups.png` — ask mode with an answer + 3 follow-up chips visible.

## Definition of Done

- [x] 2 API tests + 1 e2e pass.
- [x] Three verification passes complete clean.

**Status: Complete**
