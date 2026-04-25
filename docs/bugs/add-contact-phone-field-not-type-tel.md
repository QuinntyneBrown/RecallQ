# Add Contact phone field lacks type="tel"

**Flow:** 05 — Create Contact
**Severity:** Low-Medium (mobile UX, autocomplete)
**Status:** Complete — `add-contact.page.html` now passes `type="tel"` to the Phone `<app-input-field>`, matching the Email field's `type="email"` opt-in. Mobile keyboards switch to the phone-numeric layout and platform phone autofill triggers.

## Symptom

`add-contact.page.html` for the phone input:

```html
<app-input-field label="Phone" name="phone"
  [value]="phone()" (valueChange)="phone.set($event)" />
```

`app-input-field`'s default `type` is `text`, so the phone control
renders as `<input type="text">`. On mobile devices that means:

- The default alphanumeric keypad appears, not the phone-number
  keypad with `+`/`*`/`#`.
- iOS / Android autofill won't suggest stored phone numbers.
- Voice input dictates words rather than digits.

The Email field already opts in correctly with `type="email"` —
phone needs the parallel `type="tel"`.

## Expected

The Phone input renders with `type="tel"` so mobile keyboards switch
to the phone-numeric layout and platform autofill recognises it.

## Actual

Phone input renders with `type="text"` (the component default).

## Repro

1. Open `/contacts/new` on a mobile device (or DevTools' device
   emulation).
2. Tap the Phone field.
3. Observe: the standard text keyboard appears, not the phone
   keyboard.

## Notes

Radically simple fix: add `type="tel"` to the phone
`<app-input-field>` in `add-contact.page.html`.
