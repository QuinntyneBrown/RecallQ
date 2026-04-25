# PD007 — Starred contact hero state

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-083 |
| **Prerequisites** | `3. Contact Detail` |

## Objective

Capture the starred state of the contact detail hero so the engineer building the toggle has both states pinned.

## Scope

**In:**
- Frame `26. Contact Detail — Starred` (390×844): copy of `3. Contact Detail` with the star icon in the top bar filled (`$warning` `#FFB23D` solid fill, no stroke), and a small `Starred` chip (`Tag Solid` instance) inserted to the right of the existing tag chips on the hero.

## Design notes

- Use a copy/duplicate of `3. Contact Detail` (`sHEi5`) and only override the star and tag-row descendants.
- Do not duplicate the avatar, hero gradient, or timeline content — keep them as-is.

## Verification

- [x] Star fill color is exactly `$warning`.
- [x] No layout shift versus unstarred frame other than the new chip.

## Definition of Done

- [x] One frame (`26`) added.
- [x] PNG export.
