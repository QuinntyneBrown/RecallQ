# T026 — Responsive Shell: SM + MD

| | |
|---|---|
| **Slice** | [21 Responsive shell](../detailed-designs/21-responsive-shell/README.md) |
| **L2 traces** | L2-042, L2-043 |
| **Prerequisites** | T008 (or later — any UI task, since responsive is applied to what exists) |
| **Produces UI** | Yes |

## Objective

Introduce `BreakpointService` with `xs/sm/md/lg/xl` signals and adapt `AppShellComponent` for SM (≥576px, centered 560px column, hero grows) and MD (≥768px, sidebar replaces bottom nav, max-width 720px).

## Scope

**In:**
- `BreakpointService` using `matchMedia`.
- `tokens.css` gains `--bp-sm/md/lg/xl` constants.
- `AppShellComponent` CSS-grid template changes at SM and MD.
- `SidebarComponent` replacing `BottomNavComponent` at MD+.

**Out:**
- LG + XL layouts (T027).

## ATDD workflow

1. **Red — unit**:
   - `BreakpointService_flips_sm_true_at_576` (L2-042).
   - `BreakpointService_flips_md_true_at_768` (L2-043).
2. **Red — e2e**:
   - `T026-sm-md.spec.ts` — at 640px assert content column max 560px; at 820px assert bottom nav hidden and sidebar visible; navigation from sidebar works.
3. **Green** — implement service + shells.

## Playwright POM

Extend `AppShellPage`:
```ts
sidebar()    { return this.page.getByRole('navigation', { name: 'Sidebar' }); }
isBottomNavVisible() { return this.page.getByRole('navigation', { name: 'Main' }).isVisible(); }
```

Use `fixtures/viewports.ts`:
```ts
export const VP = {
  xs: { width: 375,  height: 667 },
  sm: { width: 640,  height: 900 },
  md: { width: 820,  height: 1180 },
  lg: { width: 1200, height: 800 },
  xl: { width: 1440, height: 900 },
};
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] One grid-template definition per breakpoint; no JS-driven layout.
- [ ] `BreakpointService` exposes only signals (no subjects).

## Screenshot

`docs/tasks/screenshots/T026-sm-md-sm.png` — SM viewport (640×900).
`docs/tasks/screenshots/T026-sm-md-md.png` — MD viewport (820×1180) with sidebar.

## Definition of Done

- [x] 2 unit tests + 1 e2e pass.
- [x] Three verification passes complete clean.

**Status: Complete**
