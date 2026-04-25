// Covers bug: docs/bugs/import-page-content-gap-too-tight.md
// Per docs/ui-design.pen Import content column 2Cnyt, gap is 24.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('import page .page gap is 24px', async ({ page }) => {
  const email = `imgp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/import');

  const section = page.locator('section.page');
  await expect(section).toBeVisible();

  const gap = await section.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('24px');
});
