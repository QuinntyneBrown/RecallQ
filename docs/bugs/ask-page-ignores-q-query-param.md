# `/ask` does not seed the input from the `?q=` query parameter

**Status:** Complete — `AskModePage.ngOnInit` now reads `q` (after `contactId`) and seeds `draft()` when no contactId is present.
**Flow:** [23 — Ask AI from Contact Detail](../flows/23-ask-from-contact/23-ask-from-contact.md) (and Flow 18 zero-state handoff)
**Traces:** L1-005, L1-010, L2-014.
**Severity:** Medium — Flow 18 step 4 promises that tapping `Ask RecallQ` from the search zero state navigates to `/ask?q={query}` "where the input is pre-seeded and auto-focused". The frontend does navigate there, but `AskModePage.ngOnInit` only reads `contactId` — `q` is ignored, so the input remains empty and the visitor still has to retype.

## Observed

`frontend/src/app/pages/ask/ask.page.ts`:

```ts
ngOnInit(): void {
  this.route.queryParamMap.subscribe(async (params) => {
    const contactId = params.get('contactId');
    this.currentContactId.set(contactId);
    if (contactId && !this.seededOnce && this.messages().length === 0) {
      this.seededOnce = true;
      try {
        const c = await this.contacts.get(contactId);
        if (c) this.draft.set(`What should I say to ${c.displayName} next?`);
      } catch { /* ignore */ }
    }
  });
}
```

There is no branch that reads `params.get('q')`. The same component is also used by the Flow 23 contact-scoped handoff but ignores Flow 18's bare-query handoff.

## Expected

When `/ask` is opened with `?q=<text>` (and no `contactId`), the SPA should seed `draft()` to that text on first mount so the visitor can hit Send immediately. The contact-scoped seeding (`What should I say to …?`) continues to take precedence when both are present.

## Fix sketch

Add a fallback branch after the `contactId` block:

```ts
if (!contactId && !this.seededOnce && this.messages().length === 0) {
  const q = params.get('q');
  if (q && q.trim()) {
    this.seededOnce = true;
    this.draft.set(q);
  }
}
```
