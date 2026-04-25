// Covers bug: docs/bugs/search-match-count-wrong-plural.md
// Match-count must read '1 contact matched' (singular) when the
// server returns exactly one hit.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('match-count uses singular when contactsMatched is 1', async ({ page }) => {
  const email = `mc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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
            similarity: 0.91,
            matchedText: 'Solo match',
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
        displayName: 'Solo Match',
        initials: 'SM',
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

  const meta = page.getByTestId('match-count');
  await expect(meta).toHaveText('1 contact matched');
});
