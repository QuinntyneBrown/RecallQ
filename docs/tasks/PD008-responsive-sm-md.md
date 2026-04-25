# PD008 — Responsive SM (≥576px) and MD (≥768px) layouts

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-042, L2-043 |
| **Prerequisites** | All XS screens (`1`–`7`) |

## Objective

Design SM (576px) and MD (768px) variants of every primary screen so the engineer doesn't guess at the bottom-nav-to-top-nav transition or content-column max-width behavior.

## Scope — one frame per screen, per breakpoint (12 frames total)

For each of: `1. Home`, `2. Search Results`, `3. Contact Detail`, `4. AI Ask Mode`, `5. Register`, `6. Login`:

- **SM variant** (576×900): keep the bottom nav; center the content column with a max width of 560; increase hero heading size to ≥38; balance side margins.
- **MD variant** (768×1024): hide the bottom nav; show a top nav (logo left, search persistent in center, profile + bell right); content max-width 720; smart stacks become a 3-column grid (no horizontal scroller); chips and cards retain XS metrics.

## Design notes

- Build a reusable `Top Nav` component once (logo + search + bell + profile) and reuse across all MD frames. Place it in the Design System frame next to `Bottom Nav`.
- For Login / Register / Forgot Password, both SM and MD center the form card at 420 max-width with the ambient glows preserved.
- Use a separate row on the canvas labeled `SM` and another labeled `MD` to keep the canvas readable.

## Verification

- [x] `Top Nav` component exists once and is referenced (`type: "ref"`) by every MD frame.
- [x] Bottom nav is absent on every MD frame.
- [x] No frame exceeds its declared width — `snapshot_layout({ problemsOnly: true })` clean.

## Definition of Done

- [x] 12 new frames laid out in clearly labeled SM and MD rows.
- [x] One reusable `Top Nav` component added to the Design System frame.
- [x] PNG exports for all 12.
