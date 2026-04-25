// Covers bug: docs/bugs/refresh-summary-wipes-existing-paragraph.md
// Per Flow 27 step 5 the loading affordance is "subtle" — the
// existing paragraph and stats must stay visible during a manual
// refresh, with aria-busy on the card signalling work in flight.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000027f00';

test('manual refresh keeps the existing paragraph visible', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Refresh Target',
          initials: 'RT',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 12,
        }),
      });
    }
    return route.continue();
  });

  let summaryHits = 0;
  await page.route(`**/api/contacts/${contactId}/summary`, (route) => {
    summaryHits++;
    if (summaryHits === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ready',
          paragraph: 'Original paragraph that must stay visible.',
          interactionCount: 12,
          sentiment: 'Warm',
          lastInteractionAt: '2026-04-22T10:00:00Z',
          generatedAt: '2026-04-23T00:00:00Z',
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'pending' }),
    });
  });

  await page.route(`**/api/contacts/${contactId}/summary:refresh`, (route) =>
    route.fulfill({ status: 202, contentType: 'application/json', body: '{}' }),
  );

  const email = `rsv-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  const paragraph = page.getByTestId('summary-paragraph');
  await expect(paragraph).toHaveText('Original paragraph that must stay visible.');

  await page.getByRole('button', { name: 'Refresh summary' }).click();

  await page.waitForTimeout(500);

  await expect(paragraph).toHaveText('Original paragraph that must stay visible.');
  await expect(page.locator('text=Generating summary…')).toHaveCount(0);
});
