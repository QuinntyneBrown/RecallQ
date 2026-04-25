# Ask assistant bubble paints --surface-elevated, design says --surface-secondary

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The AI answer bubble (`.assistant-bubble`) on `/ask` paints `--surface-elevated` (`#1B1B33`), but the design (`6rsdj` ansBubble) calls for `$surface-secondary` (`#141425`) — a quieter content surface that lets the gradient user bubble pop above it. The current bubble reads as a tappable control, not a content panel.

In `docs/ui-design.pen`:

```json
{
  "id": "6rsdj",
  "name": "ansBubble",
  "fill": "$surface-secondary",
  "cornerRadius": 18,
  "padding": 14,
  "stroke": { "fill": "$border-subtle", "thickness": 1 }
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.assistant-bubble {
  align-self: flex-start;
  background: var(--surface-elevated);   /* #1B1B33 — too light */
  color: var(--foreground-primary);
}
```

## Expected

```css
.assistant-bubble {
  align-self: flex-start;
  background: var(--surface-secondary);  /* #141425 — content surface */
  color: var(--foreground-primary);
}
```

## Fix sketch

One-token swap: `--surface-elevated` → `--surface-secondary`.
