# Ask follow-up chip drops the contact scope

**Flow:** [21 — Ask Follow-Up Chips](../flows/21-ask-followups/21-ask-followups.md)
**Traces:** L1-005, L2-024.
**Severity:** Medium — when the visitor entered Ask via a specific contact (`/ask?contactId=…`, see Flow 23) the follow-up chips replay the conversation without that contact id. The next turn is no longer scoped to the contact, so the answer drifts away from the topic the visitor came from.

## Observed

`frontend/src/app/pages/ask/ask.page.ts`:

```ts
async submit(input: HTMLInputElement): Promise<void> {
  ...
  await this.ask.send(q, this.currentContactId());
}

async handleFollowUp(text: string): Promise<void> {
  await this.ask.send(text);
}
```

`submit` passes `this.currentContactId()` so the contact id is included in the `/api/ask` body. `handleFollowUp` calls the same `send` overload without that argument, so the follow-up POST omits `contactId` even when the visitor is on `/ask?contactId=<id>`.

## Expected

Per Flow 21 step 6 ("fires flow 19 again for the new turn"), the follow-up turn should be indistinguishable from a manually-typed turn — same body, same scope.

## Fix sketch

Pass the same contact id through:

```ts
async handleFollowUp(text: string): Promise<void> {
  await this.ask.send(text, this.currentContactId());
}
```
