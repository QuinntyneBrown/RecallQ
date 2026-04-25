// Covers bug: docs/bugs/add-email-phone-patch-errors-are-silent.md
// A failed PATCH from the Add email modal must surface a toast so
// the user knows their edit did not land.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('add-email PATCH failure surfaces a toast', async ({ page }) => {
  const email = `email-err-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Email Target', initials: 'ET' });

  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  await page.getByRole('button', { name: 'Email this contact' }).click();
  await page.getByLabel('Email').fill('someone@example.com');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Could not update contact')).toBeVisible();
});
