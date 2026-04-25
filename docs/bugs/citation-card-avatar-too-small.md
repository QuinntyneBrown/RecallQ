# Citation card avatar is 28px, design says 32

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The mini avatar inside each citation card under an AI answer renders 28×28, but the design's mini-card avatar (`9ymIG` / `aRowU` / `OPbwh` inside `RZb87` / `9qiUY` / `bLNk8`) declares 32×32. The smaller circle reads pinched against the 12px name and pulls the card's vertical rhythm out of step with the surrounding 10px paddings.

In `docs/ui-design.pen` the mini-avatar (`9ymIG`):

```json
{
  "name": "m1Av",
  "cornerRadius": 999,
  "height": 32,
  "width": 32,
  "fill": { "type": "gradient", "colors": [{"color":"#7C3AFF"}, {"color":"#FF5EE7"}] }
}
```

## Observed

`frontend/src/app/ui/citation-card/citation-card.component.css`:

```css
.avatar {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  ...
}
```

## Expected

```css
.avatar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  ...
}
```

## Fix sketch

Two-line `28px` → `32px` swap.
