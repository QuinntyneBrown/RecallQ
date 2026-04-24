// Covers bug: docs/bugs/create-contact-does-not-show-contact-added-toast.md
// Flow 05 step 8 requires a "Contact added" toast on successful save.
// Current add-contact.page.ts navigates silently.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AddContactPage } from '../pages/add-contact.page';

test('create contact shows "Contact added" toast on success', async ({ page }) => {
  const email = `toast-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const addContact = new AddContactPage(page);
  await addContact.goto();
  await addContact.fill({ displayName: 'Toast Target', initials: 'TT' });
  await addContact.save();

  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
  await expect(page.getByText('Contact added')).toBeVisible();
});
