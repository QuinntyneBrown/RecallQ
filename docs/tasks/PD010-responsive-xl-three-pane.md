# PD010 — Responsive XL (≥1200px) three-pane layout

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-045 |
| **Prerequisites** | PD009 (LG layouts) |

## Objective

Design the persistent three-pane experience at XL: sidebar (navigation + Smart Stacks), center list, right detail.

## Scope

**In:**
- Frame `XL-1. App Shell + Search` (1440×960): persistent left sidebar (240 wide) with logo at top, primary nav (`Home`, `Search`, `Ask`, `Import`), divider, `Smart stacks` section with the user's stacks as vertical rows (count badge on right); center list (420 wide) with results; right pane (remaining width) with selected contact detail.
- Frame `XL-2. Home — No Search` (1440×960): center pane shows the home feed (AI suggestion + smart stacks grid), right pane shows a `This week` activity summary panel with last 7 days of interactions grouped by day.
- Frame `XL-3. Ask Mode` (1440×960): sidebar persistent, center pane = Ask conversation centered at max 720, right pane = `Cited contacts` panel listing every contact cited across the current session for quick re-open.

## Design notes

- Sidebar uses `$surface-secondary` with a 1px right border `$border-subtle`.
- Active nav item: gradient bar 2px on the left + `$foreground-primary` label + filled icon variant.
- Reuse the `Top Nav` component from PD008 only at MD/LG; XL uses the sidebar instead and the top bar collapses to a thin breadcrumb + profile menu.

## Verification

- [x] Sidebar is a single reusable component (`Sidebar Nav`) added to the Design System frame.
- [x] All three XL frames reference that component, not bespoke copies.
- [x] No frame overflows its declared width.

## Definition of Done

- [x] Three XL frames added.
- [x] One reusable `Sidebar Nav` component added.
- [x] PNG exports.
