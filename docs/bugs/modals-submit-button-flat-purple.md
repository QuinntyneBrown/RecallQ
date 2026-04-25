# Add-email/-phone modal Save button is flat purple, not the brand gradient

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md) (Add email / Add phone modal)
**Severity:** Low — visual / brand fidelity. The Save button on both modals paints a flat `--accent-primary` purple at radius 14 — the same anti-pattern recently fixed on the import upload button. The shared `app-button-primary` style is the design's brand-gradient pill.

In `docs/ui-design.pen` the reusable `Button Primary` (`8VJjL`) is a 90° gradient pill (`#7C3AFF → #FF5EE7`) with a soft purple shadow at radius 999 (full pill). Both modal Save buttons skip that pattern.

## Observed

`frontend/src/app/ui/modals/add-email.modal.css` and `add-phone.modal.css`:

```css
button[type="submit"] {
  background: var(--accent-primary);
  color: var(--foreground-primary);
  border-color: var(--accent-primary);
}
```

(The base `button` rule above gives them `padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 14px;` — none of the brand pill's height/shape/shadow.)

## Expected

Style `button[type="submit"]` to match the design's primary CTA: 90° gradient, full pill, soft purple shadow, white Geist label.

## Fix sketch

Override the base button rule on submit:

```css
button[type="submit"] {
  background: linear-gradient(
    90deg,
    var(--accent-gradient-start),
    var(--accent-gradient-end)
  );
  color: #fff;
  border: 0;
  border-radius: var(--radius-full);
  padding: 8px 18px;
  font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 600;
  box-shadow: 0 4px 12px -2px rgba(124, 58, 255, 0.35);
}
```

(Modal CTAs are smaller than full-width auth buttons, so the padding stays 8/18 rather than 0/24, but the pill / gradient / shadow match.)
