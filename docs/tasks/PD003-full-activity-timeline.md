# PD003 — Full Activity Timeline

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-011, L2-035 |
| **Prerequisites** | `3. Contact Detail` frame exists |

## Objective

Design the full-history activity screen reached from `See all N` on the contact detail. Must support long lists with reverse-chronological grouping and filtering by interaction type.

## Scope

**In:**
- Frame `15. Activity — All` (390×844): status bar; top bar (back chevron, title `Activity`, contact name as a smaller subtitle); horizontal filter chips row (`All`, `Email`, `Call`, `Meeting`, `Note`) with the active chip styled as a solid `Tag Solid`; date-grouped list with sticky group headers `Today`, `Yesterday`, `This week`, `Earlier in {Month YYYY}`; each row uses the appropriate `Ix Email/Call/Meeting/Note` component, a one-line subject, a two-line snippet (`textGrowth: fixed-width`), and a relative-time stamp on the right; bottom nav; home indicator.
- Frame `16. Activity — Empty` (variant): same chrome, with a centered illustration block (use a large lucide `inbox` icon, `$foreground-muted`), heading `No activity yet`, body, primary `Log first interaction` button routing to `13. Add Interaction`.

## Design notes

- Group header: `Geist Mono` 12 / weight 600 / `letterSpacing: 1.4` / `$foreground-muted`, padded 24-top / 8-bottom.
- Row metrics: 16 vertical padding, `gap: 12` between icon column (40 wide) and text column.
- Filter chips: 32px height, 12 horizontal padding, `$radius-full`, `$surface-elevated` for inactive, gradient for active.
- Place to the right of `3. Contact Detail` results.

## Verification

- [ ] Timeline rows use the existing `Ix *` components — no bespoke icon markup.
- [ ] Filter chips align to the same baseline as the title row.
- [ ] Empty state uses the same chrome as the populated state.

## Definition of Done

- [ ] Two frames added (`15`, `16`).
- [ ] PNG exports.
