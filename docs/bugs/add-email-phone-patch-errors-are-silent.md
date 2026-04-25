# Add-email / add-phone PATCH errors are silent

**Status:** Complete — both `catch {}` branches now call `this.toast.show('Could not update contact')`.
**Flow:** [08 — Update Contact](../flows/08-update-contact/08-update-contact.md)
**Traces:** L1-002, L2-007.
**Severity:** Medium — the only ways a user can currently trigger Flow 08 from the SPA (adding an email via the Message tile or a phone via the Call tile) swallow PATCH failures with `catch {}`. If the server returns 400/500 the modal closes, the contact is unchanged, and the user receives no signal at all — the tile just appears to do nothing on the next tap.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts` `onMessage()` and `onCall()`:

```ts
try {
  const updated = await this.contacts.patch(c.id, { emails: [v] });
  this.contact.set(updated);
  this.onMessage();
} catch {}
```

The catch is empty. `ToastService` is already injected in the same file (used by `copy phone number` and, post-fix, the star toggle) so the plumbing is present; the catch branch just never calls it.

## Expected

A failed PATCH on either modal should surface a toast so the user knows their edit didn't land. Consistent with the star-toggle fix, use `'Could not update contact'` as the copy.

## Fix sketch

Replace each empty `catch {}` with `catch { this.toast.show('Could not update contact'); }`.
