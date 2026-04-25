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

- [ ] All three modals share the same sheet header (handle + title metrics).
- [ ] Backdrop opacity does not cause text-on-blur contrast failures.

## Definition of Done

- [ ] Three frames (`20`, `21`, `22`) added.
- [ ] PNG exports.
