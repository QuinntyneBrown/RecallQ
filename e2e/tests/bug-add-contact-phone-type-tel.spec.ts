// Covers bug: docs/bugs/add-contact-phone-field-not-type-tel.md
// The Phone input on /contacts/new must have type="tel" so mobile
// users get the phone keypad and platform autofill triggers.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Add Contact phone field is type="tel"', async ({ page }) => {
  const email = `actl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/contacts/new');

  await expect(page.getByLabel('Phone')).toHaveAttribute('type', 'tel');
});
