// Covers bug: docs/bugs/all-activity-no-infinite-scroll.md
// Flow 12 — All Activity must request page 2 when the user scrolls
// near the bottom and append the rows.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000001212';

function makeRows(seed: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const id = `${seed}-${i.toString(16).padStart(12, '0')}`.slice(0, 36).padEnd(36, '0');
    return {
      id,
      contactId,
      type: 'note',
      occurredAt: new Date(2026, 0, 1, 12, 0, 0).toISOString(),
      subject: `Row ${seed}-${i}`,
      content: 'x',
      createdAt: '2026-01-01T12:00:00Z',
    };
  });
}

test('All Activity loads page 2 when sentinel scrolls into view', async ({ page }) => {
  let listHits = 0;
  await page.route(`**/api/contacts/${contactId}/interactions**`, (route) => {
    const url = new URL(route.request().url());
    const p = Number(url.searchParams.get('page') ?? '1');
    listHits++;
    if (p === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: makeRows('a', 50), nextPage: 2 }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: makeRows('b', 25), nextPage: null }),
    });
  });

  const email = `aas-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}/activity`);

  const list = page.getByTestId('all-activity');
  await expect(list).toBeVisible();
  await expect(list.locator('li')).toHaveCount(50);

  await page.getByTestId('all-activity-sentinel').scrollIntoViewIfNeeded();

  await expect.poll(() => listHits, { timeout: 5000 }).toBeGreaterThanOrEqual(2);
  await expect(list.locator('li')).toHaveCount(75);
});
