# T022 — Quick Actions: Message + Call

| | |
|---|---|
| **Slice** | [17 Quick actions: Message and Call](../detailed-designs/17-quick-actions-message-call/README.md) |
| **L2 traces** | L2-037, L2-038 |
| **Prerequisites** | T010 |
| **Produces UI** | Yes |

## Objective

Implement the Message and Call tiles on contact detail. Message opens `mailto:` or prompts to add an email; Call opens `tel:` on mobile or copies to clipboard on desktop.

## Scope

**In:**
- `MessageButton`, `CallButton` components for the action row.
- `ContactEmailsModal`, `ContactPhonesModal` modals to add when missing.
- `PATCH /api/contacts/{id}` already exists — modals reuse it.

**Out:**
- Intro / Ask AI tiles (T023 / T024).

## ATDD workflow

1. **Red — e2e**:
   - `T022-message-call.spec.ts`:
     - Contact with email → tap Message → intercept `page.on('framenavigated')` for `mailto:…` (Playwright intercept).
     - Contact without email → tap Message → modal opens → fill → save → tile now active.
     - Mobile viewport → tap Call → intercept `tel:`.
     - Desktop viewport → tap Call → assert clipboard contains phone + toast visible.
2. **Green** — implement tiles + modals.

## Playwright POM

Extend `ContactDetailPage`:
```ts
messageTile() { return this.page.getByRole('button', { name: 'Email this contact' }); }
callTile()    { return this.page.getByRole('button', { name: 'Call this contact' }); }
```

Add `pages/modals/add-email.modal.ts` and `pages/modals/add-phone.modal.ts` with `open()`, `fill(value)`, `save()`.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] No JS library is added for clipboard — `navigator.clipboard.writeText` only.
- [ ] Modals use the platform `<dialog>` element or a small `@angular/cdk/dialog` wrapper — no bespoke stack.
- [ ] Toast uses a single tiny component + a `ToastService` signal queue.

## Screenshot

`docs/tasks/screenshots/T022-message-call.png` — contact detail at 375×667 with active Message and Call tiles visible in the action row.

## Definition of Done

- [ ] 4 e2e assertions pass (covering each quadrant of email/phone × present/absent and mobile/desktop).
- [ ] Three verification passes complete clean.
