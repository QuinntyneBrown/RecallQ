// Covers bug: docs/bugs/auth-back-button-weight-too-heavy.md
// Per docs/ui-design.pen UZHtz/8lMQG, "Back to sign in" is Inter 14/500.
import { test, expect } from '@playwright/test';

test('forgot-password back link is 500 weight', async ({ page }) => {
  await page.goto('/forgot-password');

  const back = page.locator('.back');
  await expect(back).toBeVisible();

  const fontWeight = await back.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fontWeight).toBe('500');
});

test('reset-password back link is 500 weight', async ({ page }) => {
  await page.goto('/reset-password?token=fake');

  const back = page.locator('.back');
  await expect(back).toBeVisible();

  const fontWeight = await back.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fontWeight).toBe('500');
});
