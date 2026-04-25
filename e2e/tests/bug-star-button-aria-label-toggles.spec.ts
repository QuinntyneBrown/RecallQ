// Covers bug: docs/bugs/star-button-aria-label-static.md
// Flow 10 — the star button's accessible name must reflect what
// the click will do: "Star contact" when not starred, "Unstar
// contact" when starred.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000001010';

test('star button aria-label flips between Star / Unstar', async ({ page }) => {
  let starred = false;
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Star Person',
          initials: 'SP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    if (route.request().method() === 'PATCH') {
      starred = !starred;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Star Person',
          initials: 'SP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred,
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

  const email = `sba-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  await expect(page.getByRole('button', { name: 'Star contact', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Star contact', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Unstar contact', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Star contact', exact: true })).toHaveCount(0);
});
