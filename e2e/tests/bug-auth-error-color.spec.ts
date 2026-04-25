// Covers bug: docs/bugs/auth-error-text-purple-not-red.md
// The login error message renders an .err alert when credentials are
// invalid. Per docs/ui-design.pen, error copy should be #FFB3B3 (red),
// not the brand magenta the implementation paints today.
import { test, expect } from '@playwright/test';

test('login wrong-password error renders in red, not purple', async ({ page }) => {
  // Submit /login with credentials that won't match — backend returns
  // a 401 and the page surfaces an inline .err message.
  await page.goto('/login');

  await page.getByLabel('Email').fill('nobody-like-me@example.com');
  await page.getByLabel('Password').fill('definitelywrong1234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  const err = page.locator('.err');
  await expect(err).toBeVisible({ timeout: 5_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  // #FFB3B3 -> rgb(255, 179, 179)
  expect(color).toBe('rgb(255, 179, 179)');
});
