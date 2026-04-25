# Contact-detail hero tag chip is missing the white-tint border

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The tag chips inside the contact-detail hero (e.g., `Investor`, `AI`, `Series B`) ship with no border. The design draws each chip with a 1px `#FFFFFF33` (white at 20%) border on top of a `#FFFFFF22` translucent background — the border is what gives the chips their soft glass edge against the gradient hero.

In `docs/ui-design.pen` each hero tag (`m08RM` / `pIUUD` / `Se5qR`):

```json
{ "fill": "#FFFFFF22", "stroke": { "fill": "#FFFFFF33", "thickness": 1 }, ... }
```

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,0.15);
  color: var(--foreground-primary);
  font-size: 12px;
}
```

No `border` declared.

## Expected

```css
.chip {
  ...
  border: 1px solid rgba(255,255,255,0.20);
}
```

## Fix sketch

One-line CSS addition.
