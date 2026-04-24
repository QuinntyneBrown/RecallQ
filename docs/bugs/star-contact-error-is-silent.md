# Star/unstar contact error is silent

**Flow:** [10 — Star / Unstar Contact](../flows/10-star-contact/10-star-contact.md)
**Traces:** L1-002, L2-083.
**Severity:** Medium — a failed PATCH silently reverts the optimistic icon with no user-visible signal; the visitor taps the star, sees it fill, and then sees it clear for no apparent reason.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts` `toggleStar()`:

```ts
async toggleStar() {
  const c = this.contact();
  if (!c) return;
  const next = !c.starred;
  this.contact.set({ ...c, starred: next });
  try {
    const updated = await this.contacts.patch(c.id, { starred: next });
    this.contact.set(updated);
  } catch {
    this.contact.set(c); // revert only, no toast
  }
}
```

The catch branch reverts the optimistic signal but does not call `ToastService.show(...)`. `ToastService` is already injected elsewhere in the page (copy-phone), so the plumbing is present — the toast is just not emitted.

## Expected

Per Flow 10 alternatives: "`4xx/5xx` response → SPA reverts the icon and surfaces a toast **'Could not update star'**."

## Fix sketch

In the `catch` branch, after reverting, call `this.toast.show('Could not update star')`.
