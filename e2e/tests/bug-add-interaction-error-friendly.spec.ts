// Covers bug: docs/bugs/add-interaction-surfaces-raw-status.md
// A 500 from /api/contacts/:id/interactions must surface a
// friendly message, not the raw 'create_failed_500'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('add-interaction renders friendly copy on a 500', async ({ page }) => {
  const email = `aix-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Ix Target', initials: 'IX' });

  await page.route(`**/api/contacts/${id}/interactions`, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });

  await page.goto(`/contacts/${id}/interactions/new`);
  await page.locator('#content').fill('Met for coffee');
  await page.getByRole('button', { name: 'Save' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText(/create_failed/);
  await expect(alert).toContainText(/save that interaction/i);
});
