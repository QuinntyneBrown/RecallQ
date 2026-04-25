# Citation card name is 14px, design says 12

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The contact name inside each citation card under an AI answer renders at 14px, but the design text node `lUPJg` (inside `MfaBB` body of mini1 `RZb87`) declares 12px. The larger cut crowds the score-chip beside it and pulls the row's vertical rhythm out of step with the 32px avatar that just got resized.

In `docs/ui-design.pen`:

```json
{
  "id": "lUPJg",
  "content": "Sarah Mitchell",
  "fontFamily": "Geist",
  "fontSize": 12,
  "fontWeight": "600"
}
```

## Observed

`frontend/src/app/ui/citation-card/citation-card.component.css`:

```css
.row strong { font-size: 14px; font-weight: 600; }
```

## Expected

```css
.row strong { font-size: 12px; font-weight: 600; }
```

## Fix sketch

Single-property change on the `.row strong` rule.
