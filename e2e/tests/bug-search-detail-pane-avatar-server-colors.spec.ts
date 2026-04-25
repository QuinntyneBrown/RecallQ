// Covers bug: docs/bugs/search-detail-pane-avatar-ignores-server-colors.md
// At LG+ the search detail-pane avatar must honor the server's
// avatarColorA / avatarColorB on the selected contact.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test.use({ viewport: { width: 1280, height: 900 } });

test('detail-pane avatar uses server avatarColors at LG', async ({ page }) => {
  const id = '00000000-0000-0000-0000-000000003900';

  await page.route('**/api/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            contactId: id,
            matchedSource: 'contact',
            similarity: 0.85,
            matchedText: 'a hit',
            occurredAt: null,
          },
        ],
        nextPage: null,
        contactsMatched: 1,
      }),
    }),
  );

  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id,
          displayName: 'Detail Pane Person',
          initials: 'DP',
          role: 'Engineer',
          organization: 'Acme',
          location: null,
          tags: [],
          emails: [],
          phones: [],
          avatarColorA: '#22DD88',
          avatarColorB: '#0088DD',
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  const email = `dpa-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/search?q=anything');

  await page.getByTestId('featured-result').click();

  const avatar = page.locator('[data-testid="results-detail-pane"] .avatar-lg');
  await expect(avatar).toBeVisible();

  const bg = await avatar.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('rgb(34, 221, 136)');
  expect(bg).toContain('rgb(0, 136, 221)');
});
