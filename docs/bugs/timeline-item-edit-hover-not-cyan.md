# Timeline-item edit hover paints purple, project accent is cyan

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. Hovering the pencil button on a timeline interaction tints the icon `--accent-primary` purple. The project's design system standardises interactive accents on cyan (`--accent-tertiary`, per the T031 WCAG bump in `frontend/src/app/styles.css`), and the recently-fixed delete-hover state is now red. The edit-hover state is the last copy that still ties an interactive control to brand purple.

## Observed

`frontend/src/app/ui/timeline-item/timeline-item.component.css`:

```css
.edit:hover, .edit:focus-visible {
  color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}
```

## Expected

```css
.edit:hover, .edit:focus-visible {
  color: var(--accent-tertiary);
  background: color-mix(in srgb, var(--accent-tertiary) 12%, transparent);
}
```

## Fix sketch

Two-token swap. Edit-hover now reads as cyan (interactive), Delete-hover reads as red (destructive — already fixed) — no more brand purple on either.
