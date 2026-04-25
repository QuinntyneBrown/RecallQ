// Covers bug: docs/bugs/timeline-item-pill-aria-label-uses-ix-abbreviation.md
// Timeline pill must announce a plain English type label (e.g.,
// "Email", "Call") rather than the cryptic "Ix email" prefix.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000001100';
const ix1 = '11111111-1111-1111-1111-111111111101';
const ix2 = '22222222-2222-2222-2222-222222221102';

test('timeline pill aria-label announces a plain capitalised type', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Pill Person',
          initials: 'PP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [
            { id: ix1, contactId, type: 'email', occurredAt: '2026-04-22T10:00:00Z', subject: 'Email subject', content: 'a', createdAt: '2026-04-22T10:00:00Z' },
            { id: ix2, contactId, type: 'call', occurredAt: '2026-04-21T10:00:00Z', subject: 'Call notes', content: 'b', createdAt: '2026-04-21T10:00:00Z' },
          ],
          interactionTotal: 2,
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

  const email = `tpa-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  const pills = page.locator('[data-testid="timeline"] .pill');
  await expect(pills).toHaveCount(2);

  await expect(pills.nth(0)).toHaveAttribute('aria-label', 'Email');
  await expect(pills.nth(1)).toHaveAttribute('aria-label', 'Call');
});
