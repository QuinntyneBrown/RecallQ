// Covers bug: docs/bugs/summary-poll-interval-too-slow.md
// Flow 26 step 6 — summary card polls /summary every 1.5 s while
// status is pending. With a 1.5 s interval the SPA should fire ≥ 3
// requests inside ~4 s; with the old 3 s interval it'd fire only 2.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000002666';

test('summary card polls every 1.5s while pending', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Pending Person',
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
          interactionTotal: 5,
        }),
      });
    }
    return route.continue();
  });

  let summaryHits = 0;
  await page.route(`**/api/contacts/${contactId}/summary`, (route) => {
    summaryHits++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'pending' }),
    });
  });

  const email = `spc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  await expect.poll(() => summaryHits, { timeout: 4500, intervals: [200] }).toBeGreaterThanOrEqual(3);
});
