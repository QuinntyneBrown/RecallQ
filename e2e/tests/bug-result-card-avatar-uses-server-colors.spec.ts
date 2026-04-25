// Covers bug: docs/bugs/result-card-avatar-ignores-server-colors.md
// Search result-card and featured-result-card avatars must honor
// server-supplied avatarColorA/B.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('result-card avatar uses server avatarColors when present', async ({ page }) => {
  const email = `rcav-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = '00000000-0000-0000-0000-0000000000ae';

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
            matchedText: 'Color match',
            occurredAt: null,
          },
          {
            contactId: id,
            matchedSource: 'contact',
            similarity: 0.75,
            matchedText: 'Second hit',
            occurredAt: null,
          },
        ],
        nextPage: null,
        contactsMatched: 2,
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
          displayName: 'Color Person',
          initials: 'CP',
          role: null,
          organization: null,
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

  await page.goto('/search?q=anything');

  const featured = page.getByTestId('featured-result');
  await expect(featured).toBeVisible();
  const featuredBg = await featured.locator('.avatar').first().evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(featuredBg).toContain('rgb(34, 221, 136)');
  expect(featuredBg).toContain('rgb(0, 136, 221)');

  const standard = page.getByTestId('result-card').first();
  await expect(standard).toBeVisible();
  const standardBg = await standard.locator('.avatar').first().evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(standardBg).toContain('rgb(34, 221, 136)');
  expect(standardBg).toContain('rgb(0, 136, 221)');
});
