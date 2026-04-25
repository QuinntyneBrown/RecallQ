// Covers bug: docs/bugs/logout-leaks-stacks-suggestions-search-contact-counts.md
// Flow 03 — when authState transitions to null, root-scoped services
// must reset their signals. Today AskService does; StacksService and
// the others don't.
//
// To make the leak observable in Playwright we must keep the SPA
// bundle loaded across the logout boundary — page.goto() reloads
// everything and clears in-memory state, masking the bug. Use
// SPA-internal navigation (clicking router-links) only.
import { test, expect } from '@playwright/test';

test('stacks service clears on logout — SPA navigation only', async ({ page }) => {
  let stacksCalls = 0;
  let releaseSecondStacks: (() => void) | null = null;
  const secondStacksGate = new Promise<void>((resolve) => { releaseSecondStacks = resolve; });

  await page.route('**/api/stacks', async (route) => {
    stacksCalls++;
    if (stacksCalls === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '00000000-0000-0000-0000-0000000000a1', name: 'A LEAKY STACK', kind: 'Tag', count: 9 },
        ]),
      });
    }
    await secondStacksGate;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  const password = 'correcthorse12';
  const emailA = `loa-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const emailB = `lob-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

  // First and only page.goto — load the SPA at /register.
  await page.goto('/register');
  await page.getByLabel('Email').fill(emailA);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Find anyone.' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('A LEAKY STACK')).toBeVisible({ timeout: 15_000 });

  // Log A out via the SPA's profile menu (no full reload).
  await page.getByRole('button', { name: 'Profile' }).first().click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 15_000 });

  // Switch to register via the SPA router-link "Create one".
  await page.getByRole('link', { name: 'Create one' }).click();
  await expect(page).toHaveURL(/\/register$/, { timeout: 5_000 });

  await page.getByLabel('Email').fill(emailB);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Find anyone.' })).toBeVisible({ timeout: 20_000 });

  // The second /api/stacks is held by the gate. If the leak is
  // present, StacksService.stacks() still holds user A's array, so
  // the home page is currently rendering A's chip. Capture the count
  // before releasing the gate.
  const leakyCount = await page.getByText('A LEAKY STACK').count();
  releaseSecondStacks!();

  expect(leakyCount).toBe(0);
});
