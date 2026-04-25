# Ask top-bar heading is 600 weight, design says 700

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The "Ask RecallQ" heading in the `/ask` top bar paints at 600, but the design text node `92m8X` (inside `heBBi` topARow) declares Geist 17/700/-0.3. The lighter cut sits weakly above the 16-px sparkle icon and thinner than the rest of the page-level headings (32/700, 24/700) it pairs with.

In `docs/ui-design.pen`:

```json
{
  "id": "92m8X",
  "content": "Ask RecallQ",
  "fontFamily": "Geist",
  "fontSize": 17,
  "fontWeight": "700",
  "letterSpacing": -0.3
}
```

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.top-bar h1 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

## Expected

```css
.top-bar h1 {
  font-size: 16px;
  font-weight: 700;
  ...
}
```

## Fix sketch

Single-token swap on `font-weight`. (Other gaps — 17 vs 16 size, missing -0.3 letter-spacing, magenta sparkle — are tracked separately so we keep changes radically simple.)
