// Covers bug: docs/bugs/add-phone-modal-closes-before-patch-error.md
// AddPhoneModal must surface PATCH errors inline rather than
// closing on Save and dropping the typed phone.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000002901';

test('AddPhoneModal stays open with inline error on 400', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'No Phone Yet',
          initials: 'NP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ errors: { phones: ['Invalid phone'] } }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/contacts/${contactId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ready', summary: '', generatedAt: null }),
    }),
  );

  const email = `apm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  await page.getByRole('button', { name: 'Call this contact' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const phoneInput = dialog.getByLabel('Phone');
  await phoneInput.fill('+1-555-typo');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(phoneInput).toHaveValue('+1-555-typo');
});
