// Covers bug: docs/bugs/relationship-summary-stats-weight-too-light.md
// Per docs/ui-design.pen 7W1AO (children rOL0r/3QIP4/uiV1z), the three
// stat values inside the AI relationship summary card declare
// fontWeight "700". Implementation renders them at 600 — a step lighter.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000008401';

test('relationship summary stat values render at 700 weight', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Stat Weight',
          initials: 'SW',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2026-04-01T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 24,
        }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/contacts/${contactId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ready',
        paragraph: 'A test summary so the stats band renders.',
        sentiment: 'Warm',
        interactionCount: 24,
        lastInteractionAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }),
  );

  const email = `rsw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);
  await expect(page.getByTestId('summary-paragraph')).toBeVisible({ timeout: 15_000 });

  for (const id of ['stat-interactions', 'stat-sentiment', 'stat-since-last']) {
    const strong = page.getByTestId(id).locator('strong');
    const weight = await strong.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(weight, `${id} font-weight`).toBe('700');
  }
});
