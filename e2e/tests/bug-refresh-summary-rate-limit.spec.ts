// Covers bug: docs/bugs/refresh-summary-rate-limit-is-silent.md
// Flow 27 step 3 requires a toast on 429. The current SPA silently
// swallows rate-limit responses.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('429 on refresh summary shows a rate-limit toast', async ({ page }) => {
  const email = `rl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'RL Target', initials: 'RT' });

  await page.route(`**/api/contacts/${id}/summary:refresh`, (route) =>
    route.fulfill({
      status: 429,
      headers: { 'Retry-After': '60' },
      contentType: 'application/json',
      body: '{}',
    }),
  );

  await page.getByRole('button', { name: 'Refresh summary' }).click();

  await expect(page.getByText(/refresh available/i)).toBeVisible();
});
