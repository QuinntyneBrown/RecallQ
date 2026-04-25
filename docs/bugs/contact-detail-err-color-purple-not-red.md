# Contact-detail page-level `.err` paints purple, not red

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The contact-detail page-level `.err` rule still paints `--accent-secondary` brand magenta. Auth (login, register, forgot, reset), CRUD (add-contact, *-interaction, import), and the timeline delete-hover state were all just brought into spec on the design's red error language; this is the last surviving copy.

In `docs/ui-design.pen` errors render in red — `#FFB3B3` text on `#FF6B6B` icon/border (Add Contact validation patterns under frame `e9D7e`).

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.err { color: var(--accent-secondary); padding: 24px; }
```

## Expected

```css
.err { color: #FFB3B3; padding: 24px; }
```

## Fix sketch

One literal swap.
