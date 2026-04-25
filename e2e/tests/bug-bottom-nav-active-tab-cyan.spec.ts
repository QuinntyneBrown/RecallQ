// Covers bug: docs/bugs/bottom-nav-active-tab-not-cyan.md
// Per docs/ui-design.pen Bottom Nav (f4T0y), the active tab paints in
// --accent-tertiary (#4BE8FF). The xs viewport (375x667) renders the
// bottom-nav (the desktop sidebar only mounts at >= md).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('bottom nav active tab paints in cyan', async ({ page }) => {
  const email = `bnac-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const homeLink = page.locator('.bottom-nav a[aria-label="Home"]');
  await expect(homeLink).toBeVisible();

  const color = await homeLink.evaluate((el) => getComputedStyle(el).color);
  // #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
