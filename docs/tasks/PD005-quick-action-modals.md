# PD005 — Intro modal + Add-email / Add-phone modals

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-037, L2-038, L2-039 |
| **Prerequisites** | `3. Contact Detail` |

## Objective

Design the three modal overlays that hang off the quick-action row on contact detail.

## Scope

**In:**
- Frame `20. Intro Modal` (390×844, modal context): dimmed backdrop (`#0A0A16` at 70%), bottom-sheet card pinned to the bottom with `$radius-xl` top corners only, drag-handle pill, title `Intro draft`, second-party selector row (Avatar 40 + name + chevron right), AI-generated draft body in a `$surface-elevated` block with `$foreground-primary` text, footer with two equal `Copy` and `Send via email` buttons, ghost `Cancel` text-link below.
- Frame `21. Add-Email Modal`: smaller bottom sheet, title `Add email`, single email input, `Save` primary, `Cancel` ghost. Used when the `Message` quick action has no email on file (L2-037.2).
- Frame `22. Add-Phone Modal`: same structure as `21.` with a phone-formatted input. Used when the `Call` quick action has no phone on file (L2-038.3).

## Design notes

- Bottom-sheet height should be `fit_content` plus a min of 320px; content padding 24, internal `gap: 20`.
- Drag handle: 40×4, `$radius-full`, `$border-strong`, top-centered with 12 top padding.
- Backdrop is one rectangle filling the parent frame.
- Place to the right of the contact detail row of frames.

## Verification

- [x] All three modals share the same sheet header — 12-px top padding, 40×4 `$border-strong` drag handle, `$radius-xl` top corners, 24-px content padding, `gap: 20`, identical title typography (Geist 20 / 700 / -0.4 letter-spacing).
- [x] Backdrop opacity (`#0A0A16` at 70%) keeps the behind-content readably dimmed without crushing the sheet's foreground text — primary copy stays at `$foreground-primary`, never overlaying blurred regions.

## Definition of Done

- [x] Three frames (`bI0Dw` = `20. Intro Modal`, `cvmLO` = `21. Add-Email Modal`, `DwZkZ` = `22. Add-Phone Modal`) added with `placeholder: false`.
- [x] PNG exports under `docs/designs/exports/` (`bI0Dw.png`, `cvmLO.png`, `DwZkZ.png`).
