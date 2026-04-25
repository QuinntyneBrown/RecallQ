# Add/edit-interaction input focus paints purple, not cyan

**Status:** Open
**Flow:** [11 — Add Interaction](../flows/11-add-interaction/11-add-interaction.md)
**Severity:** Low — visual / brand fidelity. Both add-interaction and edit-interaction page-local inputs paint `--accent-primary` purple on focus while the global `:focus-visible` paints a cyan `--accent-tertiary` outline. Same composition gap recently patched on input-field, home search, ask, add-contact tag input, and reset-password — these are the last surviving copies.

## Observed

`frontend/src/app/pages/add-interaction/add-interaction.page.css` and
`frontend/src/app/pages/edit-interaction/edit-interaction.page.css`:

```css
.field input:focus-visible, .field textarea:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

## Expected

```css
.field input:focus-visible, .field textarea:focus-visible {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 2px var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap on each page.
