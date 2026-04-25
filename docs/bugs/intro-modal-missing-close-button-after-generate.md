# Intro modal missing Close button after generating draft

**Flow:** 30 — Quick Action: Intro Draft
**Severity:** Medium
**Status:** Complete — `intro.modal.html` post-generation actions row now renders a third button — `Close` — that wires to the existing `cancel()` handler, matching the flow's three-button contract.

## Symptom

Flow 30 step 9:

> The modal shows the editable draft with three buttons: `Copy`,
> `Send via email`, `Close`.

`intro.modal.html` only renders two buttons in the post-generation
actions row:

```html
@if (generated()) {
  …
  <div class="actions">
    <button type="button" (click)="copy()">Copy</button>
    <button type="button" (click)="sendEmail()" [disabled]="!canEmailBoth()">Send via email</button>
  </div>
}
```

There is no `Close` button. The only way to dismiss the modal after
generation is the Cancel button that lives in the *upper* action row
(beside `Generate draft`), or to press Esc / click the backdrop. That
breaks the flow's UX contract: the natural action after writing a
draft is to dismiss the modal from where the user's eye already is —
beside the Copy/Send buttons.

## Expected

After the draft is generated, three buttons sit together at the
bottom of the modal: `Copy`, `Send via email`, `Close`. Activating
`Close` dismisses the modal.

## Actual

Only `Copy` and `Send via email`. The Close affordance lives away
from the rest of the post-generation actions, in a row that also
houses `Generate draft`.

## Repro

1. Open a contact's detail page.
2. Tap `Intro`.
3. Pick a second party.
4. Tap `Generate draft`.
5. Once the draft renders, observe the bottom action row: only Copy
   + Send via email.

## Notes

Radically simple fix: add a `Close` button to the post-generation
actions row that calls the existing `cancel()` handler (which already
calls `ref.close()`).
