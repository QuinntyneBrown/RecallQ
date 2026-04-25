# Add-email/-phone modal `.err` paints purple, not red

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md) (Add email / Add phone modal)
**Severity:** Low — visual / brand fidelity. The two contact-detail modals (add-email, add-phone) still render their inline `.err` message in `--accent-secondary` brand magenta. Auth, CRUD, contact-detail page-level, and the timeline delete-hover state were all just brought into spec on the design's red error language; these two modals are the last surviving copies.

## Observed

`frontend/src/app/ui/modals/add-email.modal.css` and `add-phone.modal.css` both declare:

```css
.err {
  margin-top: 8px;
  color: var(--accent-secondary);
  font-size: 13px;
}
```

## Expected

```css
.err {
  margin-top: 8px;
  color: #FFB3B3;
  font-size: 13px;
}
```

## Fix sketch

Two literal swaps (one per modal CSS).
