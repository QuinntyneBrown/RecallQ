# Ask chat bubbles use 1.4 line-height, design says 1.5

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. Both chat bubbles on `/ask` paint at `line-height: 1.4`, but the design's assistant body text node `qpWU7` (inside `6rsdj` ansBubble) declares `lineHeight: 1.5`. The looser leading helps multi-line answers breathe and matches the rest of the design system's body-text convention (the contact-detail summary paragraph already runs at 1.45).

In `docs/ui-design.pen`:

```json
{
  "id": "qpWU7",
  "content": "Based on interaction history…",
  "fontFamily": "Inter",
  "fontSize": 13,
  "fontWeight": "normal",
  "lineHeight": 1.5
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 78%;
  font-size: 13px;
  line-height: 1.4;
  ...
}
```

## Expected

```css
.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 78%;
  font-size: 13px;
  line-height: 1.5;
  ...
}
```

## Fix sketch

One-token swap: `1.4` → `1.5`.
