# Timeline-item interaction pill colors don't match the design

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md)
**Severity:** Low — visual / brand fidelity. The timeline pills colour-code by interaction type (email / call / meeting / note), but two of the four colours are swapped against the design.

In `docs/ui-design.pen` the reusable interaction pills declare:

| Type    | Token / hex          |
|---------|----------------------|
| Email   | `#4BE8FF` (cyan)     |
| Call    | `#3DFFB3` (green)    |
| Meeting | `#BF40FF` (purple)   |
| Note    | `#FFB23D` (orange / `--star-fill`) |

The implementation maps Email to `--accent-primary` (purple `#7C3AFF`) and Note to `--accent-tertiary` (cyan `#4BE8FF`) — both off-spec.

## Observed

`frontend/src/app/ui/timeline-item/timeline-item.component.css`:

```css
.pill[data-type="email"] { background: color-mix(in srgb, var(--accent-primary) 35%, transparent); }
.pill[data-type="call"]  { background: color-mix(in srgb, var(--success) 35%, transparent); }
.pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 35%, transparent); }
.pill[data-type="note"]  { background: color-mix(in srgb, var(--accent-tertiary) 35%, transparent); }
```

## Expected

Map each type to the design hex:

```css
.pill[data-type="email"] { background: color-mix(in srgb, var(--accent-tertiary) 35%, transparent); }
.pill[data-type="call"]  { background: color-mix(in srgb, var(--success) 35%, transparent); }
.pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 35%, transparent); }
.pill[data-type="note"]  { background: color-mix(in srgb, var(--star-fill) 35%, transparent); }
```

## Fix sketch

Two-token swap. `--accent-tertiary` is the cyan token (`#4BE8FF`) and `--star-fill` is the orange token (`#FFB23D`); both are already declared in `frontend/src/app/tokens.css`.
