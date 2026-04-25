// Traces to: L2-085
import { test, expect, type APIRequestContext } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

const password = 'correcthorse12';

async function registerUser(request: APIRequestContext, email: string) {
  const response = await request.post('/api/auth/register', {
    data: { email, password },
  });
  expect(response.status()).toBe(201);
}

test('login form aligns Remember me and Forgot password on one row', async ({ page }) => {
  await page.goto('/login');

  const checkbox = page.getByRole('checkbox', { name: 'Remember me' });
  const forgot = page.getByRole('link', { name: 'Forgot password?' });
  await expect(checkbox).toBeVisible();
  await expect(forgot).toBeVisible();

  const checkboxBox = await checkbox.boundingBox();
  const forgotBox = await forgot.boundingBox();
  expect(checkboxBox).not.toBeNull();
  expect(forgotBox).not.toBeNull();
  expect(checkboxBox!.x).toBeLessThan(forgotBox!.x);
  expect(Math.abs(checkboxBox!.y + checkboxBox!.height / 2 - (forgotBox!.y + forgotBox!.height / 2))).toBeLessThan(8);
});

test('space toggles the Remember me checkbox aria state', async ({ page }) => {
  await page.goto('/login');

  const checkbox = page.getByRole('checkbox', { name: 'Remember me' });
  await checkbox.focus();
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Space');
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
});

test('checked Remember me login creates a persistent cookie', async ({ page, context, request }) => {
  const email = `remember-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerUser(request, email);

  const auth = new AuthPage(page);
  await auth.gotoLogin();
  await auth.login(email, password, true);
  await expect(page).toHaveURL(/\/home$/);

  const authCookie = (await context.cookies()).find((cookie) => cookie.name === 'rq_auth');
  expect(authCookie).toBeTruthy();
  expect(authCookie!.expires).toBeGreaterThan(Math.floor(Date.now() / 1000) + 29 * 24 * 60 * 60);
});

test('unchecked Remember me login creates a session cookie', async ({ page, context, request }) => {
  const email = `session-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerUser(request, email);

  const auth = new AuthPage(page);
  await auth.gotoLogin();
  await auth.login(email, password);
  await expect(page).toHaveURL(/\/home$/);

  const authCookie = (await context.cookies()).find((cookie) => cookie.name === 'rq_auth');
  expect(authCookie).toBeTruthy();
  expect(authCookie!.expires).toBe(-1);
});
