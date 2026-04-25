// Covers bug: docs/bugs/search-loadmore-failure-silently-ends-pagination.md
// Flow 17 — when loadMore returns a non-200, do NOT show the
// "End of results" marker; instead show a retry chip.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

function makeResults(seed: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const idx = i.toString(16).padStart(12, '0');
    return {
      contactId: `${seed}-${idx}`.padStart(36, '0').slice(0, 36),
      matchedSource: 'contact',
      similarity: 0.9 - i * 0.001,
      matchedText: `Hit ${i}`,
      occurredAt: null,
    };
  });
}

test('loadMore failure shows retry chip, not end-of-results', async ({ page }) => {
  let searchHits = 0;
  await page.route('**/api/search', (route) => {
    searchHits++;
    if (searchHits === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: makeResults('a', 50),
          nextPage: 2,
          contactsMatched: 120,
        }),
      });
    }
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await page.route(/\/api\/contacts\/[0-9a-f-]{36}$/, (route) => {
    if (route.request().method() === 'GET') {
      const url = route.request().url();
      const id = url.split('/').pop()!;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id,
          displayName: 'Person ' + id.slice(0, 6),
          initials: 'PP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  const email = `lmf-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/search?q=anything');

  await expect(page.getByTestId('featured-result')).toBeVisible();

  await page.locator('[data-testid="results-viewport"]').evaluate((el) => {
    el.scrollTo({ top: 1_000_000 });
    el.dispatchEvent(new Event('scroll'));
  });

  await expect.poll(() => searchHits, { timeout: 5000 }).toBeGreaterThanOrEqual(2);

  await expect(page.getByTestId('loadmore-retry')).toBeVisible();
  await expect(page.getByTestId('end-of-results')).toHaveCount(0);
});
