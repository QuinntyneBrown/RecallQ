# Button Primary gradient does not match ui-design.pen

**Status:** Complete — button-primary.component.ts now uses `linear-gradient(90deg, start, end)`.
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012, L2-050.
**Severity:** Medium — visual fidelity regression across every Button Primary in the app.

## Observed

On `/register`, the "Create account" button renders a **vertical** (top→bottom, 180°) three-stop gradient `#7C3AFF → #BF40FF → #FF5EE7`.

Computed `background-image`:
```
linear-gradient(rgb(124, 58, 255), rgb(191, 64, 255), rgb(255, 94, 231))
```
(CSS source: `frontend/src/app/ui/button-primary/button-primary.component.ts`.)

## Expected

`Button Primary` in `docs/ui-design.pen` (node `8VJjL`) has a **horizontal** (rotation 90 = 90°) **two-stop** gradient:
```json
{
  "type": "gradient",
  "gradientType": "linear",
  "rotation": 90,
  "colors": [
    { "color": "#7C3AFF", "position": 0 },
    { "color": "#FF5EE7", "position": 1 }
  ]
}
```

Equivalent CSS: `linear-gradient(90deg, #7C3AFF 0%, #FF5EE7 100%)`.

The mid-stop `#BF40FF` is used on the **AI suggestion card** (node `Cm94Y`, a 3-stop 135° gradient), not on the button.

## Evidence

- Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png) — button looks pink-heavy because the `#FF5EE7` bottom stop dominates visual weight.
- Computed `background-image` captured during the Flow 01 walkthrough matches the value above.

## Fix sketch

In `frontend/src/app/ui/button-primary/button-primary.component.ts`, change:
```css
background: linear-gradient(
  var(--accent-gradient-start),
  var(--accent-gradient-mid),
  var(--accent-gradient-end)
);
```
to:
```css
background: linear-gradient(
  90deg,
  var(--accent-gradient-start),
  var(--accent-gradient-end)
);
```
(Tokens are already defined in `tokens.css`.)
