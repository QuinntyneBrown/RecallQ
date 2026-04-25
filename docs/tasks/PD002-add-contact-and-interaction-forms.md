# PD002 — Add Contact / Add Interaction forms

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-005, L2-010, L2-076 |
| **Prerequisites** | none |

## Objective

Design the two manual-entry screens reached from the `+` action: Add Contact and Add Interaction. Both must match the dark glass aesthetic of existing screens and reuse design-system inputs.

## Scope

**In:**
- Frame `11. Add — Mode Toggle` (390×844): status bar, top bar (close `X`, title `New`), segmented control with two pills `Contact` / `Interaction`. The selected pill uses the gradient `Button Primary` style at reduced height (36px); the unselected pill uses `Button Ghost`.
- Frame `12. Add Contact` (390×844): scrollable form with sections —
  - Avatar preview (96×96 gradient avatar showing initials live-derived from `displayName`).
  - Required fields: `Display name`, `Initials` (2–3 chars).
  - Optional: `Role`, `Organization`, `Location`.
  - Multi-value chips: `Tags`, `Emails`, `Phones` (each a chip-input row with an `Add` ghost button).
  - Sticky bottom action bar with primary `Save contact` (gradient) and `Cancel` (ghost), respecting safe area.
- Frame `13. Add Interaction` (390×844):
  - Header with target contact card (Avatar 40 + name + role) tappable to change.
  - Type selector — 4 horizontal pills using the `Ix Email/Call/Meeting/Note` components, selected state on one.
  - `When` field with date+time picker affordance (read-only-looking field with calendar icon).
  - `Subject` (single-line input).
  - `Notes` multi-line textarea (min 6 rows, `$surface-elevated`, 16px padding, `$radius-md`).
  - Sticky bottom: `Log interaction` primary + `Cancel` ghost.
- Frame `14. Add Contact — Validation Errors` (variant): show inline error states on `Display name` (empty) and `Initials` (over 3 chars), including the error border `#FF6B6B` 1px and message text in `$warning` or a new `$danger` token.

**Out:**
- Avatar image upload UI.
- Date-picker overlay.

## Design notes

- Form rows: vertical layout, `gap: 8` between label and input, `gap: 20` between rows.
- Labels: `Inter` 14 / weight 500 / `$foreground-secondary`.
- Inputs: 48px height (single-line), 12px `$radius-md`, `$surface-elevated`, `$border-subtle` 1px stroke, focused state stroke `$accent-primary` 1.5px.
- Chip-input pattern: existing chips render via `Tag Chip` (`yTxyN`), the input grows to remaining row width, `Enter` commits.
- Sticky action bar uses backdrop blur 24 + `$surface-primary` at 70% opacity to match the Ask `inputArea` treatment.
- Place new frames in a row to the right of `7. Forgot Password` and the PD001 outputs.

## Verification

- [ ] All inputs share identical metrics (height, radius, stroke, padding).
- [ ] Validation variant clearly differs only in stroke color + helper text.
- [ ] `snapshot_layout` clean.
- [ ] Screenshots verified.

## Definition of Done

- [ ] Four frames in the canvas (`11`, `12`, `13`, `14`) with `placeholder: false`.
- [ ] PNG exports.
