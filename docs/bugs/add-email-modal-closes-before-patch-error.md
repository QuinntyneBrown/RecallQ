# Add-email modal closes before surfacing PATCH errors

**Flow:** 28 — Quick Action: Message
**Severity:** Medium-High (UX recovery path lost)
**Status:** Open

## Symptom

Flow 28 alternatives:

> **Invalid email** entered → `400` from the PATCH; **the modal
> surfaces the error**.

`AddEmailModal.save()` closes the dialog immediately with the value:

```ts
save() {
  const v = (this.value ?? '').trim();
  if (!v) return;
  this.ref.close(v);
}
```

The caller `ContactDetailPage.onMessage` receives the value, fires
the PATCH, and on failure shows a *toast* — by which point the modal
is already gone:

```ts
ref.closed.subscribe(async (value) => {
  …
  try {
    const updated = await this.contacts.patch(c.id, { emails: [v] });
    this.contact.set(updated);
    this.onMessage();
  } catch {
    this.toast.show('Could not update contact');   // <— after modal closed
  }
});
```

So a user who types an email the server rejects (400) sees a generic
toast, and has to re-tap Message and re-type the entire email from
scratch. Per the flow, the modal should stay open with an inline
error so the user can correct in place.

## Expected

- Typing a server-rejected email and tapping Save keeps the modal
  open and shows an inline error (e.g., "That email looks invalid").
- The user's typed value remains in the input.
- Cancel still closes the modal.
- A genuinely successful PATCH (200) closes the modal and continues
  the message flow.

## Actual

Modal closes regardless; user is forced back through the entry point
to retry.

## Repro

1. Open a contact with no email.
2. Tap `Message`.
3. Type any email format the server might reject (e.g., `notreal@`).
   - Or stub `PATCH /api/contacts/:id` to return 400.
4. Tap `Save`.
5. Observe: modal closes, generic "Could not update contact" toast
   appears.

## Notes

Radically simple fix:

- Add an optional `onSave: (value: string) => Promise<string | null>`
  callback to `AddEmailModal`'s injected `DIALOG_DATA`. The callback
  returns `null` on success or a user-facing error message on
  failure.
- `save()` calls the callback (if provided), awaits it, closes on
  success, or shows the returned error inline (and clears it on the
  next input change).
- `ContactDetailPage.onMessage` opens the modal with `data: { onSave:
  async (v) => { try { … patch … return null; } catch (e) { return
  e?.message === 'patch_failed_400' ? 'That email looks invalid' :
  'Could not update contact'; } } }`.
- The success branch (recursive `onMessage`) lives inside `onSave`'s
  success path, so the mailto launches once the modal has closed
  cleanly.
