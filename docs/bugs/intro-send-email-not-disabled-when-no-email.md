# Intro modal "Send via email" not disabled when either party lacks email

**Flow:** [30 — Quick Action: Intro Draft](../flows/30-quick-action-intro/30-quick-action-intro.md)
**Traces:** L1-010, L2-039.
**Severity:** Medium — Flow 30 alternatives say "Either party has no email → `Send via email` is disabled". The current button is always enabled, so tapping it on a contact with no email produces a malformed `mailto:,b@example.com?subject=…` URL whose first recipient is empty (and many mail clients reject the whole `to` field as invalid).

## Observed

`frontend/src/app/ui/modals/intro.modal.ts`:

```html
<button type="button" (click)="sendEmail()">Send via email</button>
```

```ts
sendEmail() {
  const a = this.data.contact;
  const b = this.secondParty();
  const aEmail = a.emails?.[0] ?? '';
  const bEmail = b?.emails?.[0] ?? '';
  const to = `${aEmail},${bEmail}`;
  const href = `mailto:${to}?subject=…&body=…`;
  navigateExternal(href);
}
```

The empty-string fallback silently produces a `mailto:,b@example.com` (or `mailto:a@example.com,`) when one side is missing — exactly the case the spec wants the button disabled for.

## Expected

`Send via email` should be `disabled` whenever either the active contact (party A) or the picked second party (party B) has no email on file. `Copy` remains enabled in that case.

## Fix sketch

Add a `canEmailBoth` getter and bind it as the disabled negation:

```ts
canEmailBoth(): boolean {
  return !!(this.data.contact.emails?.length) && !!(this.secondParty()?.emails?.length);
}
```

```html
<button type="button" (click)="sendEmail()" [disabled]="!canEmailBoth()">Send via email</button>
```
