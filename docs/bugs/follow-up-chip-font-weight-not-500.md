# Follow-up chip text renders at 400 weight, design says 500

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The follow-up suggestion chips below an AI answer paint their label at the user-agent default 400, but the design (`vxCOm` inside the `CLlz8` follow-up frame) calls for Inter 12/500. The medium cut helps the chip read as a tappable suggestion rather than ambient body text.

In `docs/ui-design.pen` the follow-up chip label declares:

```json
{
  "content": "Draft pitch to Sarah",
  "fill": "$foreground-primary",
  "fontFamily": "Inter",
  "fontSize": 12,
  "fontWeight": "500"
}
```

## Observed

`frontend/src/app/ui/follow-up-chip/follow-up-chip.component.css`:

```css
.chip {
  background: var(--surface-elevated);
  color: var(--foreground-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.2;
}
```

`<button>` defaults to `font-weight: 400`; the chip never sets a weight, so it renders at 400.

## Expected

```css
.chip {
  ...
  font-size: 12px;
  font-weight: 500;
  ...
}
```

## Fix sketch

Add a single `font-weight: 500` declaration.
