// Covers bug: docs/bugs/home-search-icon-not-cyan-accent.md
// Per docs/ui-design.pen Search Bar (lpCnN → 3L91d), the leading
// magnifying-glass icon must fill with #4BE8FF (--accent-tertiary).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search icon paints with the cyan accent', async ({ page }) => {
  const email = `sicn-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const icon = page.locator('.search-icon');
  await expect(icon).toBeVisible();

  const color = await icon.evaluate((el) => getComputedStyle(el).color);
  // #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
