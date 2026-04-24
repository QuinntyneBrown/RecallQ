// Covers bug: docs/bugs/login-page-surfaces-raw-error-keys.md
// Sign-in failures currently render the internal identifiers
// 'invalid_credentials' / 'login_failed' instead of actionable copy,
// and a 429 Too Many Requests is indistinguishable from a generic
// server error.
import { test, expect } from '@playwright/test';

test('login shows friendly copy for invalid credentials (401)', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('someone@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  const error = page.getByRole('alert');
  await expect(error).toBeVisible();
  await expect(error).not.toHaveText(/invalid_credentials/);
  await expect(error).toContainText(/incorrect/i);
});

test('login shows rate-limit copy for 429', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 429,
      headers: { 'Retry-After': '60' },
      contentType: 'application/json',
      body: '{}',
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('someone@example.com');
  await page.getByLabel('Password').fill('correcthorse12');
  await page.getByRole('button', { name: 'Sign in' }).click();

  const error = page.getByRole('alert');
  await expect(error).toBeVisible();
  await expect(error).not.toHaveText(/login_failed/);
  await expect(error).toContainText(/too many/i);
});
