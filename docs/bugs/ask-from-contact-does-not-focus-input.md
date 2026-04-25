# Ask from contact does not focus the input after seeding

**Flow:** 23 — Ask AI from Contact Detail
**Severity:** Medium (a11y / efficiency)
**Status:** Complete — `AskPage` now exposes a `@ViewChild('inp') inputRef` and a `focusInput()` helper that defers `focus()` to a microtask; both seed branches (contactId-based prompt and `q` param) call it after writing to the draft signal so the cursor lands in the chat input ready for edit-or-send.

## Symptom

Flow 23 step 3:

> AskModePage reads the query params, sets the input text to
> `"What should I say to {displayName} next?"`, and **focuses the
> input**.

`AskPage.ngOnInit` does the read-and-seed work but never calls
`focus()` on the chat input:

```ts
this.route.queryParamMap.subscribe(async (params) => {
  const contactId = params.get('contactId');
  this.currentContactId.set(contactId);
  if (this.seededOnce || this.messages().length > 0) return;
  if (contactId) {
    this.seededOnce = true;
    try {
      const c = await this.contacts.get(contactId);
      if (c) this.draft.set(`What should I say to ${c.displayName} next?`);
    } catch { /* ignore */ }
    return;
  }
  …
});
```

The input is decorated with `#inp` (a template ref) but nothing
focuses it from `ngAfterViewInit` or anywhere else after seeding. So
a user landing on `/ask?contactId=X` has the prompt visible but
their cursor is on the back button (default tab order start). Editing
or pressing Enter requires a manual click or several Tabs first.

## Expected

After the prompt is seeded from a `contactId` (or `q`) query param,
focus moves to the chat input so the user can immediately edit or
send by pressing Enter.

## Actual

Focus stays wherever the router-link/keyboard navigation left it
(typically the page's first focusable element).

## Repro

1. Open a contact detail page.
2. Tap `Ask AI`.
3. The seeded prompt appears in the input.
4. Press Tab — focus moves around the page chrome instead of being
   already in the input.

## Notes

Radically simple fix:

- Add `@ViewChild('inp') inputRef?: ElementRef<HTMLInputElement>;` to
  `AskPage`.
- After seeding the draft (in both the `contactId` and `q` branches)
  call `queueMicrotask(() => this.inputRef?.nativeElement.focus())`
  (microtask so Angular has flushed the new value to the DOM).
