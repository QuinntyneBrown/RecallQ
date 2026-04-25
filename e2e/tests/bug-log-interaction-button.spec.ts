// Covers bug: docs/bugs/contact-detail-has-no-log-interaction-button.md
// Flow 11's trigger places a 'Log interaction' action on the contact
// detail screen. Currently no template references /interactions/new,
// so the button does not exist.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('contact detail has a Log interaction button that routes correctly', async ({ page }) => {
  const email = `logix-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Log Target', initials: 'LT' });

  const logButton = page.getByRole('button', { name: 'Log interaction' });
  await expect(logButton).toBeVisible();

  await logButton.click();
  await expect(page).toHaveURL(new RegExp(`/contacts/${id}/interactions/new$`));
});
