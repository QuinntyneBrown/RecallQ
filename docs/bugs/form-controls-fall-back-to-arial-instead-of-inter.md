# Form controls fall back to Arial instead of Inter

**Status:** Complete — global `input, button, select, textarea { font-family: inherit; font-size: inherit; }` reset added to `frontend/src/styles.css`.
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012, L2-048.
**Severity:** Medium — every `<input>`, `<button>`, `<select>`, `<textarea>` in the app renders in Arial.

## Observed

Computed styles captured during the Flow 01 walkthrough on `/register`:

- Email input: `font-family: "Arial"`
- Password input: `font-family: "Arial"`
- Button Primary ("Create account"): `font-family: "Arial"`

The surrounding `<label>`s inherit `Inter, -apple-system, ...` from `html, body`, so labels and control text render in **different fonts** on the same form — visually inconsistent.

## Root cause

User-agent stylesheet sets form-control `font-family` to a default value (Arial on Windows Chrome). Form controls do **not** inherit `font-family` from their ancestor unless the page explicitly sets it with `font-family: inherit` (or names a font directly).

`frontend/src/styles.css` only sets `font-family` on `html, body` — not on form controls.

## Expected

All form controls should render in **Inter** (body font per `docs/ui-design.pen`), matching the surrounding labels.

## Evidence

- Computed `font-family` on `emailInput` and `button` captured during the Flow 01 walkthrough (values above).
- Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png) — label "Email" renders in Segoe UI (Inter fallback) while the placeholder/value renders in Arial.

## Fix sketch

Add a reset to `frontend/src/styles.css` (or to each form-control component):

```css
input,
button,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
}
```

Related: once the webfonts load (see *Geist and Inter web fonts are not loaded*), the controls will inherit Inter correctly.
