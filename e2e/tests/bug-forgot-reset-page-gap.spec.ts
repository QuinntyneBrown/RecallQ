// Covers bug: docs/bugs/forgot-and-reset-password-page-gap-too-tight.md
// Per docs/ui-design.pen content column uevQr, the auth-shell .page
// gap is 32. Forgot- and reset-password pages still ship 16.
import { test, expect } from '@playwright/test';

test('forgot-password page .page gap is 32px', async ({ page }) => {
  await page.goto('/forgot-password');

  const section = page.locator('section.page, .page').first();
  await expect(section).toBeVisible();

  const gap = await section.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('32px');
});

test('reset-password page .page gap is 32px', async ({ page }) => {
  await page.goto('/reset-password?token=fake');

  const section = page.locator('section.page, .page').first();
  await expect(section).toBeVisible();

  const gap = await section.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('32px');
});
