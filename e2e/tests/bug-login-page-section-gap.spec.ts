// Covers bug: docs/bugs/login-page-section-gap-too-tight.md
// Per docs/ui-design.pen content column J7c8f, the login page sections
// sit 32px apart.
import { test, expect } from '@playwright/test';

test('login page .page column gap is 32px', async ({ page }) => {
  await page.goto('/login');

  const section = page.locator('section.page');
  await expect(section).toBeVisible();

  const gap = await section.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('32px');
});
