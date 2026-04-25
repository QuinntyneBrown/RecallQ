// Covers bug: docs/bugs/add-contact-surfaces-raw-status.md
// A 500 from /api/contacts must surface a friendly message,
// not the raw 'create_failed_500'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AddContactPage } from '../pages/add-contact.page';

test('add-contact renders friendly copy on a 500', async ({ page }) => {
  const email = `acerr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/contacts', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  const addContact = new AddContactPage(page);
  await addContact.goto();
  await addContact.fill({ displayName: 'Should Fail', initials: 'SF' });
  await addContact.save();

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText(/create_failed/);
  await expect(alert).toContainText(/save that contact/i);
});
