# Add/edit-interaction type pill icons all paint purple, design varies by type

**Status:** Open
**Flow:** [11 — Add Interaction](../flows/11-add-interaction/11-add-interaction.md)
**Severity:** Low — visual / brand fidelity. The four interaction-type pills (Email, Call, Meeting, Note) tint every icon with `--accent-primary` purple. The design's interaction pills (`Ix Email` / `Ix Call` / `Ix Meeting` / `Ix Note` reusable components) colour-code each type — cyan / green / purple / orange — and the recently-fixed timeline-item pill colours follow that mapping. The interaction-type chooser should as well.

## Observed

`frontend/src/app/pages/add-interaction/add-interaction.page.css` and
`frontend/src/app/pages/edit-interaction/edit-interaction.page.css`:

```css
.pill i { color: var(--accent-primary); font-size: 18px; }
```

The HTML already attaches per-type classes (`.pill.pill-email`, `.pill-call`, `.pill-meeting`, `.pill-note`), so the colour-coded rules can be added without markup changes.

## Expected

```css
.pill i { font-size: 18px; }
.pill.pill-email i   { color: var(--accent-tertiary); } /* #4BE8FF */
.pill.pill-call i    { color: var(--success); }        /* #3DFFB3 */
.pill.pill-meeting i { color: var(--accent-secondary); } /* #BF40FF */
.pill.pill-note i    { color: var(--star-fill); }      /* #FFB23D */
```

## Fix sketch

Replace the single `.pill i` colour with the four per-type rules. No HTML change.
