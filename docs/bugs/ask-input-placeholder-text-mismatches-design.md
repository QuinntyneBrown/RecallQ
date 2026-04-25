# Ask input placeholder reads "Ask anything", design says "Ask about anyone..."

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — copy / brand fidelity. The chat input on `/ask` shows placeholder "Ask anything", but the design (`Yhnwp` inside the `tUHxK` inputBar) writes "Ask about anyone..." — a tighter framing that signals RecallQ is contact-centric (you ask *about people*, not random topics) and matches the surrounding "Find anyone." landing copy.

In `docs/ui-design.pen`:

```json
{
  "id": "Yhnwp",
  "content": "Ask about anyone...",
  "fill": "$foreground-muted",
  "fontFamily": "Inter",
  "fontSize": 14
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.html`:

```html
<input #inp type="text" aria-label="Ask a question" placeholder="Ask anything"
       [value]="draft()" (input)="draft.set($any($event.target).value)"
```

## Expected

```html
<input #inp type="text" aria-label="Ask a question" placeholder="Ask about anyone..."
       [value]="draft()" (input)="draft.set($any($event.target).value)"
```

## Fix sketch

One-string swap on the placeholder attribute. The `aria-label` stays "Ask a question" — that copy is dictated by Flow 41 and isn't what the design's placeholder text governs.
