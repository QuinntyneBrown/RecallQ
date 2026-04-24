// Covers bug: docs/bugs/contact-detail-more-button-no-action.md
// Flow 09 step 1 — user taps 'Delete contact' and confirms; the SPA
// DELETEs /api/contacts/:id, toasts 'Contact deleted', and navigates
// back. Currently the three-dots More button has no action at all.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('delete contact from detail routes home and toasts', async ({ page }) => {
  const email = `del-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Delete Target', initials: 'DT' });

  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete contact' }).click();

  await expect(page.getByText('Contact deleted')).toBeVisible();
  await expect(page).toHaveURL(/\/home$/);
});
