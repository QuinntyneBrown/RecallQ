# Contact-detail hero avatar initials are 28px, design says 36

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The initials inside the 96×96 hero avatar render at 28px, but the design sizes them at 36 to fill the avatar more confidently.

In `docs/ui-design.pen` the hero avatar (`yK4Ig` → `dQyTw`):

```json
{
  "content": "SM",
  "fontFamily": "Geist",
  "fontSize": 36,
  "fontWeight": "700",
  "letterSpacing": -1
}
```

The implementation styles the avatar as a 96×96 gradient circle but ships the initials at 28px with no letter-spacing.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.avatar {
  width: 96px; height: 96px; border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
  display: flex; align-items: center; justify-content: center;
  color: var(--foreground-primary);
  font-family: Geist, system-ui, sans-serif;
  font-weight: 700; font-size: 28px;
}
```

## Expected

```css
.avatar {
  ...
  font-weight: 700;
  font-size: 36px;
  letter-spacing: -1px;
}
```

## Fix sketch

Two-property CSS change. Markup unchanged.
