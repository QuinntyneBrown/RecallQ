// Covers bug: docs/bugs/auth-aux-link-weight-not-600.md
// Per docs/ui-design.pen ctoig, the auth aux cross-link is Inter
// 14/600.
import { test, expect } from '@playwright/test';

test('register aux `Log in` link is 600 weight', async ({ page }) => {
  await page.goto('/register');

  const link = page.locator('.aux a', { hasText: 'Log in' });
  await expect(link).toBeVisible();

  const fontWeight = await link.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fontWeight).toBe('600');
});

test('login aux `Create one` link is 600 weight', async ({ page }) => {
  await page.goto('/login');

  const link = page.locator('.aux a', { hasText: 'Create one' });
  await expect(link).toBeVisible();

  const fontWeight = await link.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fontWeight).toBe('600');
});
