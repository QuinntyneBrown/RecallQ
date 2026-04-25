// Covers bug: docs/bugs/modals-error-color-purple-not-red.md
// Open the add-email modal from contact-detail (Message tile), submit
// an invalid email, and assert the modal .err computes red.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('add-email modal .err renders in red, not purple', async ({ page }) => {
  const email = `mder-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // No emails yet → Message tile opens the add-email modal.
  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  // Force the contact patch to return 400 so the modal shows .err.
  await page.route(`**/api/contacts/${contact.id}`, (route) => {
    if (route.request().method() === 'PATCH') {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"error":"validation_failed"}',
      });
    } else {
      route.fallback();
    }
  });

  await page.goto(`/contacts/${contact.id}`);
  await page.getByRole('button', { name: 'Email this contact' }).click();

  const modalInput = page.locator('app-add-email-modal input');
  await expect(modalInput).toBeVisible({ timeout: 5_000 });
  await modalInput.fill('valid@example.com');

  await page.locator('app-add-email-modal button[type="submit"]').click();

  const err = page.locator('app-add-email-modal .err');
  await expect(err).toBeVisible({ timeout: 5_000 });

  const color = await err.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(255, 179, 179)');
});
