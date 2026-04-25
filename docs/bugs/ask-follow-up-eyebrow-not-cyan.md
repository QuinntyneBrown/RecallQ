# Ask follow-up "FOLLOW-UP" eyebrow paints muted grey, design says cyan

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The "FOLLOW-UP" eyebrow above the suggested follow-up chips paints in `--foreground-muted` grey, but the design spec (`kX2bU` inside the `04PeS` followHead frame) declares `$accent-tertiary` cyan — the same lightning-bolt accent used elsewhere as the "AI is suggesting something" affordance.

In `docs/ui-design.pen` the follow-up label declares:

```json
{
  "content": "FOLLOW-UP",
  "fill": "$accent-tertiary",
  "fontFamily": "Geist Mono",
  "fontSize": 9,
  "fontWeight": "700",
  "letterSpacing": 1.2
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.follow-up-label {
  font-family: var(--font-mono, monospace);
  letter-spacing: 1.3px;
  color: var(--foreground-muted);
  font-size: 11px;
  margin: 0 0 6px 0;
}
```

## Expected

The label should read in cyan so it visually links to the lightning-bolt motif used for AI follow-ups elsewhere:

```css
.follow-up-label {
  ...
  color: var(--accent-tertiary);
  ...
}
```

## Fix sketch

One-token swap: `--foreground-muted` → `--accent-tertiary`.
