# Ask user bubble text is 400 weight, design says 500

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The user-question bubble paints its text at the inherited 400 default, but the design's text node `1V5hQ` (inside `MeWfk` uqBubble) declares `fontWeight: "500"`. The medium cut helps the question read with a touch more authority on top of the saturated purple→magenta gradient that just got corrected.

In `docs/ui-design.pen`:

```json
{
  "id": "1V5hQ",
  "content": "who should I talk to about a Series B?",
  "fontFamily": "Inter",
  "fontSize": 13,
  "fontWeight": "500"
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
  color: var(--foreground-primary);
}
```

No `font-weight` declaration → user bubble renders at the default 400.

## Expected

```css
.user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
  color: var(--foreground-primary);
  font-weight: 500;
}
```

## Fix sketch

Add a single `font-weight: 500` declaration to `.user-bubble`. The assistant bubble stays at 400 (its design counterpart `qpWU7` declares `"normal"`), so this only touches the user variant.
