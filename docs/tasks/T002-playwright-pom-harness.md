# T002 — Playwright POM Harness

| | |
|---|---|
| **Slice** | Cross-cutting (foundation for all UI tasks) |
| **L2 traces** | — (test infrastructure) |
| **Prerequisites** | T001 |
| **Produces UI** | No |

## Objective

Stand up the Playwright test harness and the Page Object Model conventions every UI task will use. Ship it with one trivial "app loads" spec so CI confirms the harness works end-to-end.

## Scope

**In:**
- `e2e/` workspace with `playwright.config.ts`, `pages/`, `flows/`, `fixtures/`, `tests/`.
- `fixtures/screenshot.ts` with the convention from `docs/tasks/README.md`.
- `fixtures/viewports.ts` defining XS (375×667), SM (640×900), MD (820×1180), LG (1200×800), XL (1440×900).
- `fixtures/seed-api.ts` with an `apiClient` that authenticates and POSTs JSON — used by later tests to arrange state.
- `pages/app-shell.page.ts` with a single method `goto()` that navigates to `/` and waits for `body` to be visible.
- `tests/T002-harness.spec.ts` — renders `/`, screenshots it to `docs/tasks/screenshots/T002-harness.png`.

**Out:**
- Any page object beyond `AppShellPage`.
- Visual regression baselines (add in a later ops task).

## ATDD workflow

1. **Red** — write the spec:
   ```ts
   // Traces to: (harness)
   // Task: T002
   import { test } from '@playwright/test';
   import { AppShellPage } from '../pages/app-shell.page';
   import { screenshot } from '../fixtures/screenshot';
   
   test('app shell loads at XS', async ({ page }) => {
     const shell = new AppShellPage(page);
     await shell.goto();
     await screenshot(page, 'T002-harness');
   });
   ```
2. **Red** — `npx playwright test` fails because `e2e` isn't configured.
3. **Green** — add `playwright.config.ts`, install browsers, implement the page object and fixture.
4. **Green** — `npx playwright test` passes and the PNG exists.

## Playwright POM

Introduces the conventions in the repo; no further POM work beyond `AppShellPage`.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `screenshot()` writes to `docs/tasks/screenshots/` and fails loudly if the directory is missing.
- [ ] Selectors used in `AppShellPage` use `page.getByRole` / `page.getByLabel` / `page.getByTestId` — never CSS/XPath.
- [ ] `playwright.config.ts` defaults to the XS viewport; larger viewports are opt-in per project.

## Screenshot

`docs/tasks/screenshots/T002-harness.png` — any default-shell render at 375×667.

## Definition of Done

- [ ] `npx playwright test` passes and produces `T002-harness.png`.
- [ ] `pages/`, `flows/`, `fixtures/`, `tests/` directories exist with at least one file each (or placeholder `.gitkeep` for not-yet-populated folders).
- [ ] Three verification passes complete clean.
