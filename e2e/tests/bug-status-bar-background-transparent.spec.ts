// Covers bug: docs/bugs/status-bar-background-not-transparent.md
// Per docs/ui-design.pen Status Bar (kauhQ), the background fill is
// #00000000 — fully transparent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('status bar background is transparent', async ({ page }) => {
  const email = `sbbg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const bar = page.locator('[data-testid="status-bar"]');
  await expect(bar).toBeVisible();

  const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgba(0, 0, 0, 0)');
});
