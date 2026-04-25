// Covers bug: docs/bugs/login-does-not-honor-return-url.md
// Flow 02 — login must respect returnUrl from the auth guard so
// deep links survive the sign-in detour.
import { test, expect } from '@playwright/test';

test('authGuard adds returnUrl param when redirecting to /login', async ({ page }) => {
  await page.goto('/contacts/abc');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcontacts%2Fabc$/);
});

test('LoginPage navigates to returnUrl after successful sign-in', async ({ page }) => {
  const password = 'correcthorse12';
  const email = `rru-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

  // Pre-create the user via the register page, then log out so we can
  // test the login form independently.
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home$/);

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login(\?|$)/);

  await page.goto('/login?returnUrl=' + encodeURIComponent('/import'));
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/import$/);
});
