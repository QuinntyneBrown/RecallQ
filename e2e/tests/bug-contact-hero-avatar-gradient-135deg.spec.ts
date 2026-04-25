// Covers bug: docs/bugs/contact-hero-avatar-fallback-gradient-wrong-angle.md
// When the contact has no server avatarColors the hero avatar
// fallback should still use a 135deg gradient, matching every other
// avatar in the app.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000000777';

test('contact hero avatar fallback uses 135deg gradient', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Old Contact',
          initials: 'OC',
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

  const email = `gad-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  const bg = await page
    .getByTestId('hero-avatar')
    .evaluate((el) => getComputedStyle(el).backgroundImage);

  expect(bg).toContain('135deg');
});
