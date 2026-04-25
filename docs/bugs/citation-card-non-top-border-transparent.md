# Non-top citation cards have transparent border, design says --border-subtle

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The first/top citation card under an AI answer wears a faint purple stroke (`--citation-border-top` = `#7C3AFF44`) to mark it as the strongest match. The remaining cards are supposed to wear a quieter `$border-subtle` stroke so they still read as a stack of bordered cards — but the implementation makes their border `transparent`, so the lower citations float without containment.

In `docs/ui-design.pen`, mini cards 2 and 3 (`9qiUY`, `bLNk8`) declare:

```json
{ "stroke": { "fill": "$border-subtle", "thickness": 1 } }
```

while the first card (`RZb87`) declares:

```json
{ "stroke": { "fill": "#7C3AFF44", "thickness": 1 } }
```

## Observed

`frontend/src/app/ui/citation-card/citation-card.component.css`:

```css
.citation {
  ...
  border: 1px solid transparent;
}
.citation.top { border: 1px solid var(--citation-border-top); }
```

## Expected

```css
.citation {
  ...
  border: 1px solid var(--border-subtle);
}
.citation.top { border: 1px solid var(--citation-border-top); }
```

## Fix sketch

Swap `transparent` → `var(--border-subtle)` on the base `.citation` rule. The `.citation.top` override already wins at the cascade, so the top card keeps its purple tint.
