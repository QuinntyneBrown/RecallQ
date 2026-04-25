// Covers bug: docs/bugs/contact-not-found-has-no-back-button.md
// The 404 branch on /contacts/:id must expose the same Back
// affordance the loaded state has so visitors can return without
// using the browser's back button.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Contact not found state shows a Back button', async ({ page }) => {
  const email = `nf-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = '00000000-0000-0000-0000-0000000000ad';
  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  await page.goto(`/contacts/${id}`);

  await expect(page.getByText('Contact not found.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
});
