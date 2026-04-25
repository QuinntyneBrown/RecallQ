// Covers bug: docs/bugs/timeline-item-title-truncates-without-ellipsis.md
// Flow 11 — long-content interactions must end the timeline title with
// an ellipsis so users can tell they're seeing a partial title. The
// helper currently does `slice(0, 60)` with no indicator.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000001101';
const interactionId = '11111111-1111-1111-1111-111111111101';
const longContent =
  'Today I met Avery and we discussed the new product roadmap for Q2 — really productive.';

test('long-content timeline title ends with an ellipsis', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Long Note Owner',
          initials: 'LN',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2026-04-20T00:00:00Z',
          starred: false,
          recentInteractions: [
            {
              id: interactionId,
              contactId,
              type: 'note',
              occurredAt: '2026-04-24T10:30:00Z',
              subject: null,
              content: longContent,
              createdAt: '2026-04-24T10:30:00Z',
            },
          ],
          interactionTotal: 1,
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

  const email = `tte-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);
  await expect(page.getByTestId('hero-name')).toHaveText('Long Note Owner', { timeout: 15_000 });

  // The timeline item's title is in <span class="title">.
  const title = page.locator('.timeline-item .title').first();
  const titleText = await title.textContent();
  expect(titleText).not.toBeNull();
  // Title must indicate truncation happened.
  expect(titleText!.endsWith('…')).toBe(true);
  // Title must not still be the full content (it should actually be shorter).
  expect(titleText!.length).toBeLessThan(longContent.length);
});
