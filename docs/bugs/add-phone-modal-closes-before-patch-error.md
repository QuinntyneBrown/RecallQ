# Add-phone modal closes before surfacing PATCH errors

**Flow:** 29 — Quick Action: Call
**Severity:** Medium-High (UX recovery path lost)
**Status:** Open

## Symptom

`AddPhoneModal.save()` closes the dialog immediately:

```ts
save() {
  const v = (this.value ?? '').trim();
  if (!v) return;
  this.ref.close(v);
}
```

`ContactDetailPage.onCall` does the PATCH after the modal is gone
and surfaces failures via toast:

```ts
ref.closed.subscribe(async (value) => {
  …
  try {
    const updated = await this.contacts.patch(c.id, { phones: [v] });
    …
    this.onCall();
  } catch {
    this.toast.show('Could not update contact');
  }
});
```

A user who types a phone number the server rejects (400) sees a
generic toast and has to re-tap Call → re-type the whole number.
The recently-fixed `AddEmailModal` shipped an `onSave` callback
pattern that keeps the modal open and surfaces inline errors;
`AddPhoneModal` was left on the old close-immediately pattern.

## Expected

`AddPhoneModal` accepts an optional `onSave: (value: string) =>
Promise<string | null>` via `DIALOG_DATA`. `save()` awaits the
callback; on `null` it closes; on a returned error string it
shows the message inline (`role="alert"`) and keeps the typed
value. `ContactDetailPage.onCall` passes an `onSave` that maps
`patch_failed_400` → `That phone number looks invalid`.

## Actual

Modal closes regardless; user is forced back through the entry
point to retry.

## Repro

1. Open a contact with no phone.
2. Tap `Call`.
3. Type any value the server rejects (or stub the PATCH to 400).
4. Tap `Save`. Modal closes; generic toast appears; typed value is
   gone.

## Notes

Radically simple fix: mirror the `AddEmailModal` change —

- Add `AddPhoneModalData { onSave?: (value: string) => Promise<string | null> }`.
- Inject `DIALOG_DATA` (optional), expose `busy` / `error` signals,
  bind a `role="alert"` line and a `[disabled]="busy()"` Save
  button.
- `ContactDetailPage.onCall` opens the modal with `data: { onSave }`
  that runs the PATCH and returns either `null` (success) or a
  short error string. Mailto/tel handoff stays inside the
  recursive `onCall()` triggered after a clean close.
