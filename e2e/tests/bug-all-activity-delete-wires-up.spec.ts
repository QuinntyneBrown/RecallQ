// Covers bug: docs/bugs/all-activity-delete-button-does-nothing.md
// AllActivityPage must wire up (delete) on its timeline rows so
// the trash button confirms, calls DELETE /api/interactions/:id,
// and removes the row from the list.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-0000000014a0';
const ix1 = '11111111-1111-1111-1111-1111111114a1';
const ix2 = '22222222-2222-2222-2222-2222222214a2';

test('All Activity trash deletes the interaction and refreshes the list', async ({ page }) => {
  let listCalls = 0;
  await page.route(`**/api/contacts/${contactId}/interactions**`, (route) => {
    if (route.request().method() === 'GET') {
      listCalls++;
      const items = listCalls === 1
        ? [
          { id: ix1, contactId, type: 'note', occurredAt: '2026-04-22T10:00:00Z', subject: 'Alpha', content: 'a', createdAt: '2026-04-22T10:00:00Z' },
          { id: ix2, contactId, type: 'note', occurredAt: '2026-04-21T10:00:00Z', subject: 'Beta', content: 'b', createdAt: '2026-04-21T10:00:00Z' },
        ]
        : [
          { id: ix2, contactId, type: 'note', occurredAt: '2026-04-21T10:00:00Z', subject: 'Beta', content: 'b', createdAt: '2026-04-21T10:00:00Z' },
        ];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, nextPage: null }),
      });
    }
    return route.continue();
  });

  let deletedId: string | null = null;
  await page.route(`**/api/interactions/${ix1}`, (route) => {
    if (route.request().method() === 'DELETE') {
      deletedId = ix1;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  page.on('dialog', (d) => d.accept());

  const email = `aad-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}/activity`);

  const list = page.getByTestId('all-activity');
  await expect(list).toBeVisible();
  await expect(list.locator('li')).toHaveCount(2);

  await page.getByRole('button', { name: 'Delete interaction' }).first().click();

  await expect.poll(() => deletedId).toBe(ix1);
  await expect(list.locator('li')).toHaveCount(1);
});
