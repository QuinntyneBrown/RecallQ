# Intro modal `Send via email` is always disabled because the picked contact has no email field

**Flow:** 30 — Quick Action: Intro Draft
**Severity:** Medium-high (the documented "Send via email" path is unreachable for any picked second party. The button stays disabled even when both parties have emails on file. The user falls back to `Copy` and pasting into a fresh email — which silently changes the flow's UX promise of "default mail client opens with both recipients and the draft content".)
**Status:** Complete — `IntroModal.pick()` is now async; after setting `secondParty` to the list-shaped DTO it fetches the full `ContactDetailDto` via `contacts.get(c.id)` and replaces `secondParty` with the detail (guarded by an id check so a fast user picking B then C doesn't get B's late-arriving detail). `canEmailBoth()` and `sendEmail()` are unchanged — they now see the email field on the detail DTO. New e2e `bug-intro-send-email-enabled-when-both-have-emails.spec.ts` asserts the `Send via email` button is enabled after picking a second party who has an email on file. The fix doesn't touch the backend; `ContactListDto` stays lean.

## Symptom

`frontend/src/app/ui/modals/intro.modal.ts`:

```typescript
canEmailBoth(): boolean {
  return !!this.data.contact.emails?.[0] && !!this.secondParty()?.emails?.[0];
}
```

- `this.data.contact` is the `ContactDetailDto` for party A, passed in by `ContactDetailPage.onIntro()`. Detail responses include `emails`, so `this.data.contact.emails?.[0]` is correct.
- `this.secondParty()` is set by `pick(c: ContactDto)` from the candidate list:

  ```typescript
  async ngOnInit() {
    try {
      const r = await this.contacts.list(1, 50);
      this.all.set(r.items.filter(c => c.id !== this.data.contact.id));
    } catch {
      this.all.set([]);
    }
  }
  ```

  `contacts.list()` calls `GET /api/contacts`, which returns `ContactListDto` items. The backend record is:

  ```csharp
  public record ContactListDto(
      Guid Id, string DisplayName, string Initials, bool Starred,
      int InteractionTotal, DateTime? LastInteraction);
  ```

  No `Emails`, no `Phones`, no `Role`, no `Organization`, no `Tags` — those are deliberately stripped from the list payload. So the JSON for every item is `{id, displayName, initials, starred, interactionTotal, lastInteraction}`.

The frontend's `ContactDto` interface in `contacts.service.ts:7-20` *claims* `emails: string[]`, but the runtime values from `/api/contacts` don't carry that field — TypeScript's structural typing happily accepts the partial JSON because there's no runtime guard. So at runtime `secondParty.emails === undefined`, `undefined?.[0] === undefined`, `!!undefined === false`, and `canEmailBoth()` is always false.

Net effect: as soon as the user picks party B, the Send-via-email button is disabled even when both contacts have emails on file. The flow's step-1 of the email path is unreachable:

> 1. User taps `Send via email`.
> 2. SPA constructs `mailto:{A.email},{B.email}?subject={subject}&body={body}` and navigates to it.

## Expected

When both parties have at least one email, the `Send via email` button is enabled. Tapping it opens the system mail client with the comma-joined recipients and the draft.

The simplest fix is on the SPA side: after `pick(c)`, fetch the full `ContactDetailDto` via `contacts.get(c.id)` and store *that* as the second party. The detail DTO already carries `emails`, so `canEmailBoth()` and `sendEmail()` work without any backend change.

```typescript
async pick(c: ContactDto) {
  this.secondParty.set(c);
  this.query.set(c.displayName);
  try {
    const detail = await this.contacts.get(c.id);
    if (detail) this.secondParty.set(detail);
  } catch { /* keep the list-shaped DTO; canEmailBoth stays false but Copy still works */ }
}
```

Alternative: extend `ContactListDto` to include `emails`. Riskier because the list payload is the per-row shape used by the contacts list page (60+ rows per page) — pushing the email arrays into every list response wastes bytes and blunts the privacy stance of "list view shows the bare minimum".

## Actual

1. User opens contact A's detail page; A has `emails = ["alice@example.com"]`.
2. User taps `Intro`; `IntroModal` opens.
3. User types "Bob"; the picker shows contact B (whose `emails = ["bob@example.com"]` in the DB).
4. User picks B; `secondParty` is set to the list-shaped DTO with no emails field.
5. User taps `Generate draft`; the LLM returns subject + body.
6. The draft renders. `Send via email` is **disabled** because `canEmailBoth()` is false.
7. User can `Copy` the body, but the flow's "open mail client with both recipients" never happens.

## Repro (e2e)

1. Register a user. Add two contacts both with at least one email.
2. Open contact A's detail. Tap `Intro`.
3. In the modal, type the start of contact B's name and click their name in the listbox.
4. Click `Generate draft`. Wait for the body to populate.
5. Inspect the `Send via email` button: it has the `disabled` attribute even though both contacts have emails. Per flow 30, it should be enabled.

## Notes

This is a layered bug — the backend's `ContactListDto` correctly omits emails for the list view, and the frontend correctly *types* `ContactDto` to include emails for downstream use. The mistake is using a list-payload DTO where a detail-payload DTO is required. The fix lives entirely in the modal (single round-trip after pick).

Existing intro tests don't exercise the Send-via-email button's enabled state, only the Copy path and the modal close behavior.
