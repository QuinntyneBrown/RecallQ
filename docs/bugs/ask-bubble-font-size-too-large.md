# Ask chat bubbles inherit 16px body text, design says 13

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. Both chat bubbles on `/ask` inherit the unset body font-size (browser default 16px), but the design's bubble text nodes (`1V5hQ` user, `qpWU7` assistant) both declare 13px Inter. The 3-pixel surplus crowds the 78%-wide bubble against shorter messages and reads as a generic body paragraph rather than chat copy.

In `docs/ui-design.pen`:

```json
{ "id": "1V5hQ", "content": "who should I talk to about a Series B?",
  "fontFamily": "Inter", "fontSize": 13, "fontWeight": "500" }
{ "id": "qpWU7", "content": "Based on interaction history…",
  "fontFamily": "Inter", "fontSize": 13, "fontWeight": "normal", "lineHeight": 1.5 }
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 78%;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}
```

No font-size declaration → bubbles inherit 16px.

## Expected

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

## Fix sketch

Add a single `font-size: 13px` declaration to the shared `.bubble` rule. (Per-role weights — 500 user, 400 assistant — are tracked separately so we keep this change radically simple.)
