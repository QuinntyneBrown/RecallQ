// Covers bug: docs/bugs/forgot-and-reset-password-error-text-purple-not-red.md
// Both pages render .err when the backend rejects the request. Mock
// the API so the error path fires regardless of backend state.
import { test, expect } from '@playwright/test';

test('forgot-password .err renders in red, not purple', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: '{"error":"server_error"}',
    });
  });

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();

  const err = page.locator('.err');
  await expect(err).toBeVisible({ timeout: 5_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(255, 179, 179)');
});

test('reset-password .err renders in red, not purple', async ({ page }) => {
  // The passwordsMismatch error is purely client-side — entering a
  // confirm value that differs from the password renders .err.
  await page.goto('/reset-password?token=fake');
  await page.getByLabel('New password').fill('aValidPassword12');
  await page.getByLabel('Confirm password').fill('differentPassword34');

  const err = page.locator('.err');
  await expect(err).toBeVisible({ timeout: 5_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(255, 179, 179)');
});
