// Covers bug: docs/bugs/brand-wordmark-uses-inter-not-geist.md
// Per docs/ui-design.pen BtEcS the RecallQ wordmark is Geist 18/600.
import { test, expect } from '@playwright/test';

test('brand wordmark uses Geist', async ({ page }) => {
  await page.goto('/login');

  const brand = page.locator('[data-testid="brand"]');
  await expect(brand).toBeVisible();

  const fontFamily = await brand.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toContain('geist');
});
