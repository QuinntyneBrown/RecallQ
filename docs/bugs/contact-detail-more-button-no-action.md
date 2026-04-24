# Contact detail "More" button is non-functional; delete contact is not wired up

**Flow:** [09 — Delete Contact (Cascade)](../flows/09-delete-contact/09-delete-contact.md)
**Traces:** L1-002, L2-008.
**Severity:** High — Flow 09's primary user trigger ("User taps **Delete contact** and confirms the modal.") has no frontend implementation. The three-dots `More` button on the contact detail hero is rendered without a click handler or a menu, and there is no other path to delete a contact from the SPA.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts` line 33:

```html
<button type="button" class="icon-btn" aria-label="More">
  <i class="ph ph-dots-three"></i>
</button>
```

The button has no `(click)` binding, no downstream menu, and `ContactsService` exposes no `delete(id)` method. `grep` for `Contact deleted` / `DELETE` in `frontend/src/app/**` returns no matches. A visitor tapping the three-dots icon sees no visible feedback.

## Expected

Per Flow 09 step 1, tapping "Delete contact" should open a confirmation, and on confirm the SPA should issue `DELETE /api/contacts/:id`, show a toast "Contact deleted", and navigate back. At minimum the `More` button must be reachable — either as a `Delete contact` dropdown or (radically simplest) directly triggering a confirm dialog.

## Fix sketch

1. Add `delete(id: string): Promise<void>` to `ContactsService`, POSTing `DELETE /api/contacts/:id` and throwing on non-2xx.
2. Wire the `More` button to a `deleteContact()` handler that calls `window.confirm('Delete this contact? This cannot be undone.')`, awaits the `contacts.delete`, shows the toast `'Contact deleted'`, and `router.navigateByUrl('/home')`.
3. Relabel the button `aria-label="Delete contact"` (so assistive tech matches the action).
