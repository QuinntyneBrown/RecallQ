# PD009 — Responsive LG (≥992px) two-pane layout

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-044 |
| **Prerequisites** | PD008 (`Top Nav` component) |

## Objective

Design the two-pane layout used at LG: results list on the left (max 420 wide), selected contact detail on the right. Plus the same two-pane treatment for Home → opens a contact directly.

## Scope

**In:**
- Frame `LG-1. App Shell + Search` (1280×900): top nav across the top; left pane = results list (420 max, scrollable, selected item highlighted with `$surface-elevated` and a 2px left accent bar in `$accent-primary`); right pane = contact detail at native fidelity (hero, summary, full timeline up to 20 items, no `See all` truncation).
- Frame `LG-2. Search — No Selection` (1280×900): right pane shows a placeholder card (lucide `mouse-pointer-click` icon, `Select a result to see the full profile`).
- Frame `LG-3. Home` (1280×900): left pane = home feed (greeting + suggestion + smart stacks shown vertically), right pane = a "recently active" summary panel with the 5 most-recent contacts as small cards.
- Frame `LG-4. Ask Mode` (1280×900): conversation centered with max width 720 (Ask remains a single column even at LG); left rail collapses to icon-only.

## Design notes

- Pane divider: 1px stroke `$border-subtle`.
- Selected-row indicator: 2px accent bar, full row height, on the inside-left of the row.
- The right-pane detail uses the same component composition as `3. Contact Detail` but without the bottom nav and with extra timeline rows visible.

## Verification

- [ ] Right-pane detail re-uses existing detail components (`heroAvatar`, `aiSummary`, etc.) — no parallel duplication.
- [ ] No frame uses absolute positioning where flex would suffice.

## Definition of Done

- [ ] Four LG frames added.
- [ ] PNG exports.
