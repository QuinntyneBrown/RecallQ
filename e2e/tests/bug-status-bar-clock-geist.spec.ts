// Covers bug: docs/bugs/status-bar-clock-not-geist.md
// Per docs/ui-design.pen Status Bar (kauhQ → VT2mS) the time element
// uses Geist.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('status bar clock uses Geist', async ({ page }) => {
  const email = `sbck-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const clock = page.locator('[data-testid="status-clock"]');
  await expect(clock).toBeVisible();

  const fontFamily = await clock.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toContain('geist');
});
