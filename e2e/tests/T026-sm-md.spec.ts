// Traces to: L2-042, L2-043
// Task: T026
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AppShellPage } from '../pages/app-shell.page';
import { VIEWPORTS } from '../fixtures/viewports';
import { screenshot } from '../fixtures/screenshot';

test('responsive shell: SM centers content and keeps bottom nav; MD shows sidebar and hides bottom nav', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const shell = new AppShellPage(page);

  // SM: 640x900
  await page.setViewportSize(VIEWPORTS.sm);
  await page.goto('/home');
  await page.waitForLoadState('domcontentloaded');

  const contentMaxWidthSm = await page.locator('main.content').evaluate(el =>
    parseFloat(getComputedStyle(el).maxWidth),
  );
  expect(contentMaxWidthSm).toBeLessThanOrEqual(560);
  expect(await shell.isBottomNavVisible()).toBe(true);
  await screenshot(page, 'T026-sm-md-sm');

  // MD: 820x1180
  await page.setViewportSize(VIEWPORTS.md);
  await page.goto('/home');
  await page.waitForLoadState('domcontentloaded');

  await expect(shell.sidebar()).toBeVisible();
  expect(await shell.isBottomNavVisible()).toBe(false);

  await shell.sidebar().getByRole('link', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search$/);

  await screenshot(page, 'T026-sm-md-md');
});
