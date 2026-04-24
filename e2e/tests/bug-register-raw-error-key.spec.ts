// Covers bug: docs/bugs/register-page-surfaces-raw-error-key-register-failed.md
// When the backend rejects a password as too weak it returns 400
// { error: 'weak_password' }, but the UI prints 'register_failed' —
// the internal fallback identifier thrown from auth.service.ts — with
// no guidance on the actual rule. The UI must translate the server's
// error code into a user-facing message.
import { test, expect } from '@playwright/test';

test('register shows a friendly message for weak_password', async ({ page }) => {
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'weak_password' }),
    });
  });

  await page.goto('/register');
  await page.getByLabel('Email').fill('someone@example.com');
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();

  const error = page.getByRole('alert');
  await expect(error).toBeVisible();
  await expect(error).not.toHaveText(/register_failed/);
  await expect(error).toContainText(/12 characters/);
});
