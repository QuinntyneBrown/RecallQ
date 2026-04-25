// Covers bug: docs/bugs/home-greeting-name-not-capitalized.md
// Per the home design, the greeting name is capitalised. The
// SPA computes it from the email local-part and currently leaves
// it lowercase.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home greeting capitalises the email local-part', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `quinn-${stamp}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const greeting = page.locator('.greeting');
  await expect(greeting).toBeVisible();
  const text = (await greeting.textContent())?.trim() ?? '';
  expect(text).toMatch(new RegExp(`^Good (morning|afternoon|evening), Quinn-${stamp}$`));
});
