# Reset-password local `.field` gap is 8, design says 16

**Status:** Open
**Flow:** Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. Reset-password uses an inline `<div class="field">` instead of the shared `app-input-field` component (because it needs the show/hide password toggle inside the labelRow). The local `.field { gap: 8px }` rule misses the same fix that just shipped on the shared component (`input-field-internal-gap-too-tight.md` → 16).

In `docs/ui-design.pen` the form lays every label and input at gap 16 — there is no nested grouping with a tighter gap. The shared `app-input-field` was just patched to match. This page-local copy lags behind.

## Observed

`frontend/src/app/pages/reset-password/reset-password.page.css`:

```css
.field {
  gap: 8px;
  width: 100%;
}
```

## Expected

```css
.field {
  gap: 16px;
  width: 100%;
}
```

## Fix sketch

One-token swap. Brings the page-local field column into the same rhythm as every other auth form.
