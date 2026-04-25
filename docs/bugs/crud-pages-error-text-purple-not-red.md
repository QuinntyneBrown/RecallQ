# CRUD page error messages paint purple, not the design's red

**Status:** Open
**Flow:** [04 — Add Contact](../flows/04-add-contact/04-add-contact.md), [11 — Add Interaction](../flows/11-add-interaction/11-add-interaction.md), [Import CSV](../flows/), edit-interaction
**Severity:** Low — visual / brand fidelity. Four CRUD pages still render their inline `.err` message in `--accent-secondary` brand magenta. Auth (login, register, forgot-password, reset-password) was already brought into spec on the same value.

In `docs/ui-design.pen` errors render in red — `#FFB3B3` text shipped on `#FF6B6B` icon/border (see Add Contact validation patterns under frame `e9D7e`).

## Observed

The same `.err { color: var(--accent-secondary); ... }` rule lives in:

- `frontend/src/app/pages/add-contact/add-contact.page.css`
- `frontend/src/app/pages/add-interaction/add-interaction.page.css`
- `frontend/src/app/pages/edit-interaction/edit-interaction.page.css`
- `frontend/src/app/pages/import/import.page.css`

## Expected

```css
.err {
  color: #FFB3B3;
  /* font-size etc unchanged */
}
```

## Fix sketch

Four single-line literal swaps. No HTML change.
