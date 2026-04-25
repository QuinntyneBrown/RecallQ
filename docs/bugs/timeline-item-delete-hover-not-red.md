# Timeline-item delete hover paints magenta, design errors are red

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md), [11 — Edit/Delete Interaction](../flows/)
**Severity:** Low — visual / brand fidelity. Hovering the trash button on a timeline interaction tints the icon `--accent-secondary` magenta. Throughout `docs/ui-design.pen` destructive actions paint red (`#FF6B6B` / `#FFB3B3`); the recent auth/CRUD `.err` fixes already swapped this token across error messages. The delete-hover state is the last surviving copy.

## Observed

`frontend/src/app/ui/timeline-item/timeline-item.component.css`:

```css
.del:hover, .del:focus-visible {
  color: var(--accent-secondary);
  background: color-mix(in srgb, var(--accent-secondary) 12%, transparent);
}
```

## Expected

```css
.del:hover, .del:focus-visible {
  color: #FF6B6B;
  background: color-mix(in srgb, #FF6B6B 12%, transparent);
}
```

## Fix sketch

Two literal swaps. Brand magenta for delete-hover read as a brand accent; the design's red language reads as destructive.
