# Contact-detail "Log" button paints purple, project accent is cyan

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The "+ Log" button next to the timeline header tints `--accent-primary` purple. Every other interactive accent in the app — see-all link, edit hover, search input focus, sidebar/bottom-nav active state — has been brought onto cyan `--accent-tertiary` in recent fixes; the Log button is the last copy still tied to brand purple in the contact-detail surface.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.log-btn {
  ...
  color: var(--accent-primary);
  ...
}
.log-btn:hover, .log-btn:focus-visible {
  background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
}
```

## Expected

```css
.log-btn {
  ...
  color: var(--accent-tertiary);
  ...
}
.log-btn:hover, .log-btn:focus-visible {
  background: color-mix(in srgb, var(--accent-tertiary) 10%, transparent);
}
```

## Fix sketch

Two-token swap.
