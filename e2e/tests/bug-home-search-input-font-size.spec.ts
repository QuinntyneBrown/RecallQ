// Covers bug: docs/bugs/home-search-input-font-size-mismatch.md
// Per docs/ui-design.pen Search Bar (lpCnN → l9VNc), the search input
// text/placeholder is Inter 15.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search input font-size matches ui-design.pen', async ({ page }) => {
  const email = `sfsz-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const input = page.locator('.search-input');
  await expect(input).toBeVisible();

  const fontSize = await input.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('15px');
});
