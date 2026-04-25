# Intro modal locks the subject input as readonly — user can't edit it before Copy/Send

**Flow:** 30 — Quick Action: Intro Draft (step 9)
**Severity:** Medium-High (the user can tailor the body but is stuck with whatever subject the LLM produced; the `mailto:` and the Copy paths both end up shipping the locked subject regardless of how the user edited the body)
**Status:** Complete — `intro.modal.html` no longer marks `#draft-subject` as `readonly` and now wires `(input)="onSubjectInput($event)"` through to the `subject` signal in `intro.modal.ts`. New e2e test `bug-intro-modal-subject-editable.spec.ts` types over the generated subject and asserts the new value sticks. (Verification of that test against the live backend is currently blocked by an unrelated broken build — the in-progress forgot/reset-password feature has dangling references to `PasswordResetToken`, `PasswordResetTokenService`, `IPasswordResetEmailSender` — but the fix itself is a frontend-only change confirmed by code review.)

## Symptom

`frontend/src/app/ui/modals/intro.modal.html`:

```html
@if (generated()) {
  <label for="draft-subject">Subject</label>
  <input id="draft-subject" type="text" readonly [value]="subject()" />

  <label for="draft-body">Draft body</label>
  <textarea
    id="draft-body"
    role="textbox"
    aria-label="Draft body"
    [value]="body()"
    (input)="onBodyInput($event)"
    rows="10"
  ></textarea>
  …
}
```

The body is bidirectionally editable: `[value]="body()"` plus `(input)="onBodyInput($event)"` writes back through `body.set(...)`. The subject is **read-only** (`readonly` attribute, no input handler, no setter on the `subject` signal beyond the post-generate write).

But flow 30 step 9 explicitly says:

> 9. The modal shows the **editable draft** with three buttons: `Copy`, `Send via email`, `Close`.

"Editable draft" means both fields. And both downstream actions consume the locked subject:

- `copy()` writes `this.body()` only — so the user can't even paste, edit, and re-copy a custom subject. They have to handle it out-of-band in their email client. (Subject is not on the clipboard at all.)
- `sendEmail()` builds `mailto:${to}?subject=${encodeURIComponent(this.subject())}&body=…` — every introduction email goes out under whatever subject the LLM happened to produce.

The result: a user who customizes the body to add a personal note lands in their mail client with their tailored body but a generic, AI-flavored subject — and most often will close and rewrite manually, which defeats the point of the quick action.

## Expected

The subject input behaves like the body textarea:

- Pre-filled with the LLM output.
- Fully editable (no `readonly`).
- Two-way bound — typing updates `subject()` so `sendEmail()` and a future "include subject in copy" action use the user's text.

## Actual

`<input … readonly [value]="subject()" />` — the field is non-interactive after generation. Tab-focus reaches it but typing does nothing. Mailto and copy use the AI-supplied subject only.

## Repro

1. Open a contact with an email address on file.
2. Tap **Intro**, pick a second party who also has an email, tap **Generate draft**.
3. Click into the Subject input — observe the cursor lands but no characters can be typed (the input is `readonly`).
4. Edit the body to add a personal sentence.
5. Tap **Send via email** — the mail client opens with `subject=` set to the original LLM-generated text. The user's edits to the body are present, but the subject is locked.

## Notes

Radically simple fix — drop `readonly`, mirror the body's input-binding pattern:

```html
<label for="draft-subject">Subject</label>
<input
  id="draft-subject"
  type="text"
  [value]="subject()"
  (input)="onSubjectInput($event)"
/>
```

And add the symmetric handler in `intro.modal.ts`:

```typescript
onSubjectInput(e: Event) {
  this.subject.set((e.target as HTMLInputElement).value);
}
```

No backend or routing changes. The existing rate-limiter and copy/send paths already read `subject()` at click-time, so they'll pick up the user's edits without further wiring.
