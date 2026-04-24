# Button Primary shadow does not match ui-design.pen

**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012, L2-049, L2-050.
**Severity:** Low — off-spec glow, visible on every Button Primary.

## Observed

The "Create account" button computes:
```
box-shadow: rgba(124, 58, 255, 0.35) 0px 4px 16px 0px;
```
(Source: `frontend/src/app/ui/button-primary/button-primary.component.ts`.)

- Offset y: **4 px**
- Blur: **16 px**
- Spread: **0 px**
- Color alpha: **0.35**

## Expected

`Button Primary` in `docs/ui-design.pen` (node `8VJjL`) effect:
```json
{
  "type": "shadow",
  "shadowType": "outer",
  "blur": 24,
  "color": "#7C3AFF66",
  "offset": { "x": 0, "y": 8 },
  "spread": -4
}
```

Equivalent CSS: `box-shadow: 0 8px 24px -4px rgba(124, 58, 255, 0.40);`

- Offset y: **8 px** (currently 4)
- Blur: **24 px** (currently 16)
- Spread: **-4 px** (currently 0)
- Color alpha: **0.40** / hex `#7C3AFF66` (currently 0.35)

## Evidence

- Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png).
- Computed `box-shadow` captured during the Flow 01 walkthrough matches the value above.

## Fix sketch

```css
box-shadow: 0 8px 24px -4px rgba(124, 58, 255, 0.40);
```
