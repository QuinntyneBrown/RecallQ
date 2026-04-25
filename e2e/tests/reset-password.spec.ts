// Traces to: L2-088, L2-089
import { test, expect } from '@playwright/test';

const strongPassword = 'correcthorse34';

test('page with no token shows broken-link panel and request-new-link CTA', async ({ page }) => {
  await page.goto('/reset-password');

  await expect(page.getByRole('heading', { name: 'This link is invalid or expired' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
});

test('password mismatch disables submit and shows inline error', async ({ page }) => {
  await page.goto('/reset-password?token=test-token');

  await page.getByLabel('New password').fill(strongPassword);
  await page.getByLabel('Confirm password').fill('differenthorse34');

  await expect(page.getByText('Passwords must match.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update password' })).toBeDisabled();
});

test('show and hide toggle flips password input type', async ({ page }) => {
  await page.goto('/reset-password?token=test-token');

  const password = page.getByLabel('New password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show passwords' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide passwords' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('submit success redirects to login and shows confirmation toast', async ({ page }) => {
  await page.route('**/api/auth/reset-password', (route) => route.fulfill({ status: 200, body: '' }));
  await page.goto('/reset-password?token=test-token');

  await page.getByLabel('New password').fill(strongPassword);
  await page.getByLabel('Confirm password').fill(strongPassword);
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Password updated. Please sign in.')).toBeVisible();
});

test('400 invalid token flips to broken-link panel', async ({ page }) => {
  await page.route('**/api/auth/reset-password', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_token' }),
    }),
  );
  await page.goto('/reset-password?token=expired-token');

  await page.getByLabel('New password').fill(strongPassword);
  await page.getByLabel('Confirm password').fill(strongPassword);
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page.getByRole('heading', { name: 'This link is invalid or expired' })).toBeVisible();
});

test('reset password page uses the auth chrome and primary action', async ({ page }) => {
  await page.goto('/reset-password?token=test-token');

  await expect(page.getByText('RecallQ')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update password' })).toBeVisible();
});
