// Covers bug: docs/bugs/crud-pages-error-text-purple-not-red.md
// add-contact: submit the empty form to make backend validation fire
// — it returns field errors that render via .err.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const RED = 'rgb(255, 179, 179)'; // #FFB3B3

test('add-contact page .err renders in red', async ({ page }) => {
  const email = `acer-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');
  await page.goto('/contacts/new');

  // Empty submit — backend rejects with field errors.
  await page.getByRole('button', { name: 'Save' }).click();

  const err = page.locator('.err').first();
  await expect(err).toBeVisible({ timeout: 5_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe(RED);
});
