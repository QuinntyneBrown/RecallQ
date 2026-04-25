// Traces to: L2-003, L2-004
// Task: T006
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { registerAndLogin } from '../flows/register.flow';
import { screenshot } from '../fixtures/screenshot';

test('anonymous user is redirected to login', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fhome$/);
});

test('register, login, and logout flow', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';

  await registerAndLogin(page, email, password);

  const auth = new AuthPage(page);
  await auth.logout();
  await expect(page).toHaveURL(/\/login$/);

  await screenshot(page, 'T006-login');
});
