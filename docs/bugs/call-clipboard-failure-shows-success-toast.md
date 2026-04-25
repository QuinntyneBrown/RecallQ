# Call clipboard failure shows the success toast

**Flow:** 29 — Quick Action: Call
**Severity:** High (misleading UX)
**Status:** Complete — `ContactDetailPage.onCall`'s catch branch now toasts `Couldn't copy — call <phone>` instead of the success message, so the user can both see the failure and read the number to dial manually.

## Symptom

`ContactDetailPage.onCall` for the desktop branch:

```ts
try {
  await navigator.clipboard.writeText(phone);
  this.toast.show('Phone number copied');
} catch {
  this.toast.show('Phone number copied');   // <— same message on failure
}
```

When the browser denies clipboard access (corporate browsers, some
focus-state edge cases, missing user gesture, etc.), the catch path
fires the **same** `Phone number copied` toast. The user is told the
number is on their clipboard when it isn't — they paste into their
phone and get whatever was there before, leading to a silent
mis-call or a confused "why did this paste a recipe" moment.

Flow 29 alternatives:

> **Clipboard permission denied** (rare) → fall back to a modal
> showing the phone as selectable text.

The SPA currently does neither (no modal, and the fallback toast
falsely claims success).

## Expected

- On success: a toast confirming the number was copied.
- On failure: a clearly distinguishable toast that doesn't claim
  success — e.g., `Couldn't copy — call manually: 555-1234` or a
  modal with the number as selectable text per the flow.

## Actual

Both branches show `Phone number copied`. The user has no signal
that the copy failed.

## Repro

1. At a viewport ≥ MD, open a contact whose phone is set.
2. In a browser with `navigator.clipboard` disabled (or stub the
   API to throw — e.g., `Object.defineProperty(navigator, 'clipboard',
   { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true })`).
3. Tap `Call`.
4. Observe: `Phone number copied` toast even though nothing landed
   on the clipboard.

## Notes

Radically simple fix:

- Change the catch branch to a different toast that *does not* claim
  success, e.g., `'Couldn't copy phone'`.
- For an even more flow-faithful follow-up, surface the number as
  selectable text in a future iteration. But the immediate priority
  is to stop lying to the user about success.
