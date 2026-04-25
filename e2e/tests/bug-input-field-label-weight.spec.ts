// Covers bug: docs/bugs/input-field-label-weight-mismatch.md
// Per docs/ui-design.pen nodes Uxxkk and 9WwnQ, the form labels are
// Inter 14/500. The shared input-field component declares no
// font-weight, so labels inherit 400.
import { test, expect } from '@playwright/test';

test('input-field label is 500 weight', async ({ page }) => {
  await page.goto('/register');

  const label = page.locator('label', { hasText: 'Email' }).first();
  await expect(label).toBeVisible();

  const fontWeight = await label.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fontWeight).toBe('500');
});
