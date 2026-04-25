# Import page upload button uses flat purple, not the brand gradient pill

**Status:** Open
**Flow:** [Import CSV](../flows/)
**Severity:** Low — visual / brand fidelity. The upload CTA on `/import` is a flat purple rectangle, but every other primary CTA in the app uses the design's brand-gradient pill (`docs/ui-design.pen` Button Primary `8VJjL`).

In `docs/ui-design.pen` the reusable `Button Primary`:

- `cornerRadius: 999` (full pill)
- `fill`: linear gradient `#7C3AFF → #FF5EE7` at 90°
- shadow: blur 24, color `#7C3AFF66`, offset y 8, spread -4
- label: Geist 15 / 600

The shared `app-button-primary` component already implements that pattern (after recent fixes for typography, gradient direction, and shadow). The import page rolls its own `<button class="upload-btn">` instead.

## Observed

`frontend/src/app/pages/import/import.page.css`:

```css
.upload-btn {
  height: 48px; border: 0; border-radius: var(--radius-md);
  background: var(--accent-primary); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer;
}
```

A 14px radius flat-purple button — none of the design's brand language.

## Expected

Match the shared component:

```css
.upload-btn {
  height: 48px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--radius-full);
  color: #fff;
  background: linear-gradient(
    90deg,
    var(--accent-gradient-start),
    var(--accent-gradient-end)
  );
  font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px -4px rgba(124, 58, 255, 0.40);
}
```

## Fix sketch

Either swap the markup to `<app-button-primary>` (cleaner long-term) or copy the rule above into the existing `.upload-btn` (radically simple). Either way, the import CTA picks up the design's brand pill.
