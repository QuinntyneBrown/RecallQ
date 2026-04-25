// Covers bug: docs/bugs/contact-detail-err-color-purple-not-red.md
// Visit a contact id that won't resolve so the "Contact not found."
// .err renders, then assert it computes red rgb(255,179,179).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('contact-detail not-found .err renders in red, not purple', async ({ page }) => {
  const email = `cder-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/contacts/00000000-0000-0000-0000-000000000000');

  const err = page.locator('.err', { hasText: 'Contact not found.' });
  await expect(err).toBeVisible({ timeout: 10_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(255, 179, 179)');
});
