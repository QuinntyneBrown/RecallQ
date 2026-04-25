// Covers bug: docs/bugs/summary-since-last-shows-0h-for-sub-hour-times.md
// Flow 26 — when the last interaction is between 1 and 59 minutes ago,
// the relationship-summary stat band must show minutes (e.g. "30m"), not
// the rounded-down "0h" the helper currently returns.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000002601';

test('Since last stat renders minutes for interactions under 1 hour old', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Recent Caller',
          initials: 'RC',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2026-04-01T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 1,
        }),
      });
    }
    return route.continue();
  });

  // 30 minutes ago — the dead-zone the bug describes.
  const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString();

  await page.route(`**/api/contacts/${contactId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ready',
        paragraph: 'You spoke with Recent Caller about the upcoming product launch.',
        sentiment: 'Warm',
        interactionCount: 1,
        lastInteractionAt: thirtyMinAgo,
        updatedAt: thirtyMinAgo,
      }),
    }),
  );

  const email = `ssl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);
  await expect(page.getByTestId('hero-name')).toHaveText('Recent Caller', { timeout: 15_000 });
  await expect(page.getByTestId('summary-paragraph')).toBeVisible();

  // Bug: this currently reads "0h"; expected is "30m".
  const sinceLast = page.getByTestId('stat-since-last').locator('strong');
  await expect(sinceLast).toHaveText(/^\d+m$/);
  await expect(sinceLast).toHaveText('30m');
});
