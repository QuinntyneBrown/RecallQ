# Ask chat bubbles use 20px radius, design says 18

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. Both the user and assistant chat bubbles on `/ask` are rounded at `var(--radius-lg)` (20px), but the design's two bubble frames (`MeWfk` user, `6rsdj` assistant) both declare `cornerRadius: 18`. The 2-pixel surplus reads as a slightly softer-than-spec corner against the surrounding 18-px feature cards.

In `docs/ui-design.pen`:

```json
{ "id": "MeWfk", "name": "uqBubble",  "cornerRadius": 18 }
{ "id": "6rsdj", "name": "ansBubble", "cornerRadius": 18 }
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.bubble {
  padding: 12px 16px;
  border-radius: var(--radius-lg);   /* 20px */
  max-width: 78%;
  ...
}
```

## Expected

```css
.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 78%;
  ...
}
```

## Fix sketch

Single-property literal: `var(--radius-lg)` → `18px`. We don't introduce a new token because no other surface in the audited design re-uses 18 — the answer/citation cards happen to share it but each declares the literal locally.
