// Covers bug: docs/bugs/search-no-end-of-results-marker.md
// Per Flow 17 step 7, when nextPage is null the SPA must render
// an end-of-results marker.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('search shows an end-of-results marker when nextPage is null', async ({ page }) => {
  const email = `eor-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            contactId: '00000000-0000-0000-0000-000000000001',
            matchedSource: 'contact',
            similarity: 0.92,
            matchedText: 'Final result',
            occurredAt: null,
          },
        ],
        nextPage: null,
        contactsMatched: 1,
      }),
    }),
  );

  await page.route('**/api/contacts/00000000-0000-0000-0000-000000000001', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        displayName: 'Final Person',
        initials: 'FP',
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
    }),
  );

  await page.goto('/search?q=anything');

  await expect(page.getByTestId('end-of-results')).toBeVisible();
});
