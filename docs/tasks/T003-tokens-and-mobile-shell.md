# T003 — Design Tokens + Mobile Shell Chrome

| | |
|---|---|
| **Slice** | [01 Architecture skeleton](../detailed-designs/01-architecture-skeleton/README.md) |
| **L2 traces** | L2-047, L2-048, L2-049, L2-050 (Status Bar / Home Indicator / Bottom Nav parity), L2-081 |
| **Prerequisites** | T001, T002 |
| **Produces UI** | Yes |

## Objective

Create `tokens.css` from the variables in `ui-design.pen` and ship the three mobile chrome components as Angular standalone components: `StatusBarComponent`, `HomeIndicatorComponent`, `BottomNavComponent`. No content behind them yet — this establishes the mobile frame every later screen slots into.

## Scope

**In:**
- `web/src/app/tokens.css` — defines every `--*` custom property referenced in L2-047.
- `web/src/app/ui/status-bar/status-bar.component.ts` — 50px, `$surface-primary` background, stub clock text at center.
- `web/src/app/ui/home-indicator/home-indicator.component.ts` — 34px, centered 140px pill.
- `web/src/app/ui/bottom-nav/bottom-nav.component.ts` — 80px, 4 stub icon buttons using Phosphor icons: `house`, `magnifying-glass`, `sparkle`, `user`.
- `AppShellComponent` renders these around the `<router-outlet>`.

**Out:**
- Any real navigation behavior behind the bottom nav items (T006/T007/T016 wire those).
- Breakpoint-aware layout (T026/T027).

## ATDD workflow

1. **Red — unit** — write `tokens.spec.ts` that reads `tokens.css` and asserts every required variable (L2-047) is declared.
2. **Red — e2e** — write `tests/T003-shell.spec.ts` using `AppShellPage.mobileFrame()` which locates status bar + bottom nav + home indicator.
3. **Red** — both tests fail.
4. **Green** — author `tokens.css` and the three components. Register them in `AppShellComponent`.
5. **Green** — tests pass.

## Playwright POM

Add to `pages/app-shell.page.ts`:
```ts
mobileFrame() {
  return {
    statusBar:     this.page.getByTestId('status-bar'),
    bottomNav:     this.page.getByRole('navigation', { name: 'Main' }),
    homeIndicator: this.page.getByTestId('home-indicator'),
  };
}
```

The bottom nav uses `<nav aria-label="Main">` — no `data-testid` needed.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Every color/radius token referenced by any later component maps to a `--*` variable in `tokens.css`.
- [ ] No component uses a literal hex color except when implementing a gradient that references `--accent-gradient-*` tokens.
- [ ] Bottom nav and status bar dimensions match `kauhQ` / `f4T0y` / `JRdjy` in the pen within 1px.

## Screenshot

`docs/tasks/screenshots/T003-shell.png` — empty shell at 375×667 showing status bar top, empty content middle, bottom nav bottom.

## Definition of Done

- [x] `tokens.spec.ts` passes.
- [x] `T003-shell.spec.ts` passes and renders the screenshot.
- [x] No literal hex codes in `status-bar`, `home-indicator`, `bottom-nav` except inside gradient tuples.
- [x] Three verification passes complete clean.

**Status: Complete**
