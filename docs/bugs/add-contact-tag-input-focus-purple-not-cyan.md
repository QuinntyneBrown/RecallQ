# Add-contact tag input focus paints purple, not cyan

**Status:** Open
**Flow:** [04 — Add Contact](../flows/04-add-contact/04-add-contact.md)
**Severity:** Low — visual / brand fidelity. The Tags field on `/contacts/new` is a page-local input (not the shared `app-input-field`) — its `:focus-visible` rule paints `--accent-primary` purple while the global `:focus-visible` paints a cyan `--accent-tertiary` outline. Same composition gap recently patched on input-field, home search, and ask input — this is the last surviving copy across the auth/CRUD inputs.

The design system standardises focus on cyan (per the T031 WCAG AA bump). Every other focusable surface routes through `--accent-tertiary`; this single rule breaks the pattern.

## Observed

`frontend/src/app/pages/add-contact/add-contact.page.css`:

```css
.tag-label input:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

## Expected

```css
.tag-label input:focus-visible {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 2px var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap.
