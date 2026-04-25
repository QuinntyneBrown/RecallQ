// Covers bug: docs/bugs/input-field-internal-gap-too-tight.md
// Per docs/ui-design.pen form RmbOJ, label → input gap is 16 (the
// same gap the form uses everywhere). Implementation packs label and
// input into a column with gap 8.
import { test, expect } from '@playwright/test';

test('input-field internal gap matches design 16', async ({ page }) => {
  await page.goto('/register');

  const field = page.locator('.field').first();
  await expect(field).toBeVisible();

  const gap = await field.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('16px');
});
