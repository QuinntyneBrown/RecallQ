# PD004 — CSV Import screen

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-077 |
| **Prerequisites** | none |

## Objective

Design the bulk-import flow used to seed contacts from a CSV file. Must cover three states: drop-zone (idle), parsing/uploading (progress), and result (success with row counts, or per-row error list).

## Scope

**In:**
- Frame `17. Import — Idle` (390×844): top bar (back, title `Import contacts`), instructional copy listing the required columns (`displayName, role, organization, emails, phones, tags, location` — semicolon-separated multi-values), a dashed-border drop zone (`$border-strong` dashed 1.5px, `$radius-lg`, 200 high) with lucide `upload-cloud` icon, primary text `Drop CSV here or tap to browse`, secondary `Up to 5,000 rows`. Below: a `Download template` ghost link.
- Frame `18. Import — Processing` (variant): drop zone replaced with a card showing filename, row-count, an indeterminate progress bar in the gradient palette, and a `Cancel` ghost button.
- Frame `19. Import — Result` (variant): success card with green check, `{N} contacts imported`, `{M} rows skipped`, an expandable error list (each row: row number + reason in `$foreground-muted`), primary `Go to home` and ghost `Import another file`.

## Design notes

- Drop zone hover/active state: stroke shifts to `$accent-tertiary`, fill to `$surface-elevated` at 60%.
- Progress bar: 6px tall, `$radius-full`, fill is the brand linear gradient.
- Result card uses `$radius-lg` and a subtle outer glow shadow already used on the AI suggestion card.

## Verification

- [x] All three states share the same outer chrome — `kauhQ` status bar, identical top bar (chevron-left + "Import contacts" title + 36-px spacer), `JRdjy` home indicator, 24-px content margins.
- [x] Error list rows are visually distinguishable (Geist Mono row numbers in `$foreground-muted`, reasons right-aligned in `$foreground-secondary`, divider strokes via `$border-subtle`) but stay readable against the elevated card surface.

## Definition of Done

- [x] Three frames (`4Hnlr` = `17. Import — Idle`, `232sO` = `18. Import — Processing`, `C3BEu` = `19. Import — Result`) added with `placeholder: false`.
- [x] PNG exports under `docs/designs/exports/` (`4Hnlr.png`, `232sO.png`, `C3BEu.png`).
