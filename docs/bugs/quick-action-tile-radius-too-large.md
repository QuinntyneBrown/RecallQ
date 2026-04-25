# Quick action tile border-radius is 20, design says 16

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The four action-row tiles (Message, Call, Intro, Ask AI) round at the page-wide `--radius-lg` (20px), but the design rounds them at 16.

In `docs/ui-design.pen` the contact-detail action row tiles (`NQkMx` / `Dc9kr` / `SdOzr` / `9GU3V`) all declare `cornerRadius: 16`.

## Observed

`frontend/src/app/ui/quick-action-tile/quick-action-tile.component.css`:

```css
.tile {
  ...
  border-radius: var(--radius-lg);
  ...
}
```

`--radius-lg` is `20px` in `tokens.css`.

## Expected

```css
.tile {
  ...
  border-radius: 16px;
  ...
}
```

## Fix sketch

One literal swap (or introduce a new `--radius-md-large: 16px` token if you want it reusable; design uses 16 only for these tiles and the AI summary card).
