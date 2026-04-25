# Reset-password local input focus paints purple, not cyan

**Status:** Open
**Flow:** Flow 43 (reset password)
**Severity:** Low — visual / brand fidelity. Reset-password's page-local password fields paint `--accent-primary` purple on focus while the global `:focus-visible` paints a cyan `--accent-tertiary` outline. Same composition gap recently patched on input-field, home search, ask input, and add-contact tag input — this is the last surviving copy.

## Observed

`frontend/src/app/pages/reset-password/reset-password.page.css`:

```css
input:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

## Expected

```css
input:focus-visible {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 2px var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap. Completes the project's cyan-only focus strategy across every text input.
