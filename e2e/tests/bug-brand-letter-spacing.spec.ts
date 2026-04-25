// Covers bug: docs/bugs/brand-letter-spacing-not-matching-design.md
// Per docs/ui-design.pen BtEcS, the brand wordmark uses -0.3px
// letter-spacing.
import { test, expect } from '@playwright/test';

test('brand wordmark letter-spacing matches design', async ({ page }) => {
  await page.goto('/login');

  const brand = page.locator('[data-testid="brand"]');
  await expect(brand).toBeVisible();

  const ls = await brand.evaluate((el) => getComputedStyle(el).letterSpacing);
  expect(ls).toBe('-0.3px');
});
