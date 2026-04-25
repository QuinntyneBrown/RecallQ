// Covers bug: docs/bugs/see-all-activity-link-full-page-reload.md
// The 'See all N' link must use Angular routerLink so SPA state
// survives. We detect a full page reload by setting a sentinel
// on window before the click and checking it survives.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('See all link navigates without a full page reload', async ({ page }) => {
  const email = `seeall-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Many IX', initials: 'MX' });

  // Mock the contact GET so the detail page reports interactionTotal > 3 and
  // the See all link renders without needing to actually create 4 interactions.
  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id,
          displayName: 'Many IX',
          initials: 'MX',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          avatarColorA: null,
          avatarColorB: null,
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 24,
        }),
      });
    }
    return route.continue();
  });
  // Activity page also needs an interactions list response so it doesn't
  // explode after the navigation.
  await page.route(`**/api/contacts/${id}/interactions*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], nextPage: null }),
    }),
  );

  await page.goto(`/contacts/${id}`);

  await page.evaluate(() => ((window as unknown as { __sentinel?: string }).__sentinel = 'kept'));
  await page.getByRole('link', { name: /See all 24/ }).click();

  await expect(page).toHaveURL(new RegExp(`/contacts/${id}/activity$`));
  const sentinel = await page.evaluate(() => (window as unknown as { __sentinel?: string }).__sentinel);
  expect(sentinel).toBe('kept');
});
