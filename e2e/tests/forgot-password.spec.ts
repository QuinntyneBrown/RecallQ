// Traces to: L2-086, L2-087
import { test, expect } from '@playwright/test';

test('login screen Forgot password link routes to forgot password page', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('link', { name: 'Forgot password?' }).click();

  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible();
});

test('email typed on login is pre-filled on Forgot Password page', async ({ page }) => {
  const email = `prefill-${Date.now()}@example.com`;
  await page.goto('/login');

  await page.getByLabel('Email').fill(email);
  await page.getByRole('link', { name: 'Forgot password?' }).click();

  await expect(page).toHaveURL(new RegExp(`/forgot-password\\?email=${email}`));
  await expect(page.getByLabel('Email')).toHaveValue(email);
});

test('submitting valid email shows generic success panel and calls API once', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/auth/forgot-password', (route) => {
    calls += 1;
    route.fulfill({ status: 202, body: '' });
  });
  await page.goto('/forgot-password');

  await page.getByLabel('Email').fill('known@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();

  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  await expect(page.getByText("If an account exists for known@example.com, we've sent a reset link. Check your inbox.")).toBeVisible();
  expect(calls).toBe(1);
});

test('unknown email shows the same generic success panel', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', (route) => route.fulfill({ status: 202, body: '' }));
  await page.goto('/forgot-password');

  await page.getByLabel('Email').fill('unknown@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();

  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  await expect(page.getByText("If an account exists for unknown@example.com, we've sent a reset link. Check your inbox.")).toBeVisible();
});

test('back to sign in routes to login', async ({ page }) => {
  await page.goto('/forgot-password');

  await page.getByRole('link', { name: 'Back to sign in' }).click();

  await expect(page).toHaveURL(/\/login$/);
});

test('forgot password layout remains usable across requested widths', async ({ page }) => {
  for (const width of [390, 576, 768, 992, 1200]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
    const pageBox = await page.locator('.page').boundingBox();
    expect(pageBox).not.toBeNull();
    expect(pageBox!.width).toBeLessThanOrEqual(390);
  }
});

test('Forgot password link uses accent color and semibold weight', async ({ page }) => {
  await page.goto('/login');

  const forgot = page.getByRole('link', { name: 'Forgot password?' });
  await expect(forgot).toBeVisible();
  await expect(forgot).toHaveCSS('color', 'rgb(75, 232, 255)');
  await expect(forgot).toHaveCSS('font-weight', '600');
});
