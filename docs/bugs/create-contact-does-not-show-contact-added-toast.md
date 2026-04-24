# Create contact does not show "Contact added" toast

**Status:** Complete — `add-contact.page.ts` now calls `toast.show('Contact added')` after the navigation on success.
**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md)
**Traces:** L1-002, L2-005.
**Severity:** Medium — silent success breaks the feedback loop Flow 05 step 8 explicitly calls for, and the user has to infer from the URL change that the save succeeded.

## Observed

After submitting `/contacts/new`, `frontend/src/app/pages/add-contact/add-contact.page.ts` navigates to `/contacts/:id` but never calls `ToastService.show(...)`:

```ts
const result = await this.contacts.create(payload);
await this.router.navigateByUrl('/contacts/' + result.id);
```

The `ToastService` and `ToastHostComponent` already exist and are used by other features (copy-phone-number, intro-modal draft-copied), so the plumbing is there — the create-contact flow just never emits the event.

## Expected

Per Flow 05 step 8: "The SPA navigates to `/contacts/:id` and shows the toast **'Contact added'**."

After a successful POST `201 Created`, the user should see a 2.5-second toast reading **"Contact added"** anchored above the bottom nav, confirming the new row landed server-side.

## Fix sketch

Inject `ToastService` into `AddContactPage` and call `toast.show('Contact added')` between `contacts.create(payload)` and the `router.navigateByUrl` — or right after the navigation completes.
