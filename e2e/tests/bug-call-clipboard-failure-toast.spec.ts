// Covers bug: docs/bugs/call-clipboard-failure-shows-success-toast.md
// Flow 29 — when navigator.clipboard.writeText fails on the desktop
// branch the toast must NOT claim success.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test.use({ viewport: { width: 1024, height: 768 } });

const contactId = '00000000-0000-0000-0000-000000002900';

test('call clipboard failure surfaces a non-success toast', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Phone Person',
          initials: 'PP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: ['555-1234'],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
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

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });
  });

  const email = `clp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  await page.getByRole('button', { name: 'Call this contact' }).click();

  const toast = page.locator('.toast').first();
  await expect(toast).toBeVisible();
  await expect(toast).not.toHaveText(/copied/i);
});
