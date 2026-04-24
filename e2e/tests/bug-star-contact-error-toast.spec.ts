// Covers bug: docs/bugs/star-contact-error-is-silent.md
// A failed star PATCH must revert the optimistic icon AND surface
// a toast "Could not update star", per Flow 10.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('star toggle shows error toast when the PATCH fails', async ({ page }) => {
  const email = `star-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Star Target', initials: 'ST' });

  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  const starButton = page.getByRole('button', { name: 'Star contact' });
  await expect(starButton).toBeVisible();
  await starButton.click();

  await expect(page.getByText('Could not update star')).toBeVisible();
});
