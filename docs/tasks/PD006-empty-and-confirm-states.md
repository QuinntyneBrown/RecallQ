# PD006 — Search zero-state, Stack list, Ask new-session confirm

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-020, L2-025, L2-027, L2-082 |
| **Prerequisites** | `2. Search Results`, `4. AI Ask Mode` |

## Objective

Cover the three remaining empty/confirm states that current screens imply but do not depict.

## Scope

**In:**
- Frame `23. Search Results — Zero` (390×844): same chrome as `2. Search Results`; meta band reads `0 contacts matched`; in place of the featured card, a centered zero-state card with lucide `search-x` icon, heading `No matches`, body `Try rephrasing or open Ask mode`, primary `Open Ask` gradient button.
- Frame `24. Stack Filtered List` (390×844): variant of `2. Search Results` where the query chip displays the stack name (e.g., `AI founders`) prefixed with a small lucide `layers` icon, the meta band reads `{N} in this stack`, and the sort control offers `Most recent interaction` / `Name` (no `Similarity`).
- Frame `25. Ask — New Session Confirm` (390×844, modal context): backdrop dim over `4. AI Ask Mode`; centered confirm card, title `Start a new session?`, body `Your current conversation will be cleared.`, two horizontal buttons `Cancel` (ghost) and `Start new` (gradient).

## Design notes

- Zero-state and confirm-card widths: 320 (XS), centered horizontally.
- The stack-filtered list reuses existing result-card components verbatim — only the chip and meta differ.

## Verification

- [ ] Zero-state and stack-list both reuse the same top-bar component as `2. Search Results`.
- [ ] Confirm modal uses the same backdrop opacity as PD005 modals.

## Definition of Done

- [ ] Three frames (`23`, `24`, `25`) added.
- [ ] PNG exports.
