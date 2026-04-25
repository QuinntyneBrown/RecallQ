// Covers bug: docs/bugs/reset-password-field-gap-too-tight.md
// Per docs/ui-design.pen, the auth form lays every label and input
// at gap 16. The reset-password page-local .field still uses 8.
import { test, expect } from '@playwright/test';

test('reset-password .field gap is 16px', async ({ page }) => {
  await page.goto('/reset-password?token=fake');

  const field = page.locator('.field').first();
  await expect(field).toBeVisible();

  const gap = await field.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('16px');
});
