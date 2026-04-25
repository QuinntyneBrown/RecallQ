# Interaction-pills email + note colors swapped vs design

**Status:** Open
**Flow:** [03 — Contact Detail](../flows/03-contact-detail/03-contact-detail.md), [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The shared `app-interaction-pills` component (used inside result-card, featured-result-card, and the contact-detail recent-activity glance) maps email to purple and note to cyan. The design's pill palette — and the recently-fixed timeline-item — uses cyan for email and orange for note.

In `docs/ui-design.pen` the reusable interaction pills declare:

| Type    | Token / hex          |
|---------|----------------------|
| Email   | `#4BE8FF` (cyan)     |
| Call    | `#3DFFB3` (green)    |
| Meeting | `#BF40FF` (purple)   |
| Note    | `#FFB23D` (orange / `--star-fill`) |

## Observed

`frontend/src/app/ui/interaction-pills/interaction-pills.component.css`:

```css
.pill[data-type="email"]   { background: color-mix(in srgb, var(--accent-primary) 25%, transparent); }
.pill[data-type="call"]    { background: color-mix(in srgb, var(--success) 25%, transparent); }
.pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 25%, transparent); }
.pill[data-type="note"]    { background: color-mix(in srgb, var(--accent-tertiary) 25%, transparent); }
```

## Expected

```css
.pill[data-type="email"]   { background: color-mix(in srgb, var(--accent-tertiary) 25%, transparent); }
.pill[data-type="call"]    { background: color-mix(in srgb, var(--success) 25%, transparent); }
.pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 25%, transparent); }
.pill[data-type="note"]    { background: color-mix(in srgb, var(--star-fill) 25%, transparent); }
```

## Fix sketch

Two-token swap. Mirrors the recently-shipped timeline-item fix.
