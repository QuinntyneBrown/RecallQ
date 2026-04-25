// Covers bug: docs/bugs/sidebar-active-tab-not-cyan.md
// The sidebar is the desktop counterpart of docs/ui-design.pen Bottom
// Nav (f4T0y), where the active tab paints --accent-tertiary
// (#4BE8FF). The sidebar mounts at >= md, so the test forces an md
// viewport.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { VIEWPORTS } from '../fixtures/viewports';

test.use({ viewport: VIEWPORTS.md });

test('sidebar active tab paints in cyan', async ({ page }) => {
  const email = `sbac-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const homeLink = page.locator('.sidebar a[aria-label="Home"]');
  await expect(homeLink).toBeVisible();

  const color = await homeLink.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(75, 232, 255)');
});
