// Covers bug: docs/bugs/add-email-modal-closes-before-patch-error.md
// Flow 28 — Invalid email PATCH must surface in the modal, which
// must stay open with the user's typed value preserved.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000002800';

test('AddEmailModal stays open with inline error on 400', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'No Email Yet',
          initials: 'NE',
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
        body: JSON.stringify({ errors: { emails: ['Invalid email'] } }),
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

  const email = `aem-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  await page.getByRole('button', { name: 'Email this contact' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const emailInput = dialog.getByLabel('Email');
  await emailInput.fill('a@b.co');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(emailInput).toHaveValue('a@b.co');
});
