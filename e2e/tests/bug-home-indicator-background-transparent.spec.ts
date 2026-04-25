// Covers bug: docs/bugs/home-indicator-background-not-transparent.md
// Per docs/ui-design.pen Home Indicator (JRdjy), the strip around the
// pill is transparent (#00000000).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home indicator strip is transparent', async ({ page }) => {
  const email = `hibg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const strip = page.locator('[data-testid="home-indicator"]');
  await expect(strip).toBeVisible();

  const bg = await strip.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgba(0, 0, 0, 0)');
});
