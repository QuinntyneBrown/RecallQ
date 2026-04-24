# T024 — Quick Action: Ask AI From Contact

| | |
|---|---|
| **Slice** | [19 Ask AI from contact](../detailed-designs/19-quick-action-ask-from-contact/README.md) |
| **L2 traces** | L2-040 |
| **Prerequisites** | T016, T010 |
| **Produces UI** | Yes |

## Objective

Tapping the gradient `Ask AI` tile on contact detail opens `/ask?contactId=…`. The Ask page pre-seeds the input with `What should I say to {name} next?` and biases retrieval toward that contact.

## Scope

**In:**
- `AskButton` tile in action row — matches `aAsk` / `9GU3V` (gradient fill, sparkle icon).
- Ask page reads `contactId` query param, calls `/api/contacts/{id}`, seeds the input.
- `/api/ask` accepts an optional `contactId` and biases retrieval.

**Out:**
- Prompt template variations / rotation.

## ATDD workflow

1. **Red — unit (API)**:
   - `Ask_with_contactId_prepends_that_contact_to_context` (L2-040) — inspect the outgoing prompt in `FakeChatClient.lastSystemPrompt`.
2. **Red — e2e**:
   - `T024-ask-from-contact.spec.ts` — open a contact detail; tap `Ask AI`; assert URL `/ask?contactId=…`; assert input contains `What should I say to {name} next?`; edit input; send; assert the sent question reflects edits, not the seed.
3. **Green** — implement.

## Playwright POM

Extend `AskModePage`:
```ts
seededInputValue() { return this.page.getByRole('textbox', { name: 'Ask anything' }).inputValue(); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The seed is applied only on initial load — not every time the page is revisited with different `contactId`.
- [ ] `Ask AI` tile uses the same shared gradient-button primitive as the AI suggestion card.

## Screenshot

`docs/tasks/screenshots/T024-ask-from-contact.png` — ask page at 375×667 with seeded input text and contact context visible.

## Definition of Done

- [ ] 1 API test + 1 e2e pass.
- [ ] Three verification passes complete clean.
