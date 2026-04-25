// Covers bug: docs/bugs/auth-recovery-headings-missing-letter-spacing.md
// Per docs/ui-design.pen lxKY9, the auth-recovery headings use Geist
// 32/700/-0.8 letter-spacing.
import { test, expect } from '@playwright/test';

test('forgot-password h1 has -0.8px letter-spacing', async ({ page }) => {
  await page.goto('/forgot-password');

  const h1 = page.getByRole('heading', { name: 'Forgot password?' });
  await expect(h1).toBeVisible();

  const ls = await h1.evaluate((el) => getComputedStyle(el).letterSpacing);
  expect(ls).toBe('-0.8px');
});

test('reset-password h1 has -0.8px letter-spacing', async ({ page }) => {
  await page.goto('/reset-password?token=fake');

  const h1 = page.getByRole('heading', { name: 'Set a new password' });
  await expect(h1).toBeVisible();

  const ls = await h1.evaluate((el) => getComputedStyle(el).letterSpacing);
  expect(ls).toBe('-0.8px');
});
