// Covers bug: docs/bugs/delete-interaction-has-no-ui-affordance.md
// Each timeline row must expose a delete affordance that drops
// the interaction after a confirm, per Flow 14.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('timeline row delete removes the interaction after confirm', async ({ page }) => {
  const email = `del-ix-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Ix Target', initials: 'IX' });

  // Seed a contact-detail GET that includes one interaction so the
  // test does not need a running embedding/persistence pipeline.
  let firstFetch = true;
  await page.route(`**/api/contacts/${id}`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      const body = firstFetch
        ? {
            id,
            displayName: 'Ix Target',
            initials: 'IX',
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
            recentInteractions: [
              {
                id: 'int-7',
                contactId: id,
                type: 'note',
                occurredAt: '2025-12-15T10:00:00Z',
                subject: 'Coffee chat',
                content: 'we met',
                createdAt: '2025-12-15T10:00:00Z',
              },
            ],
            interactionTotal: 1,
          }
        : { /* second fetch — interaction removed */
            id,
            displayName: 'Ix Target',
            initials: 'IX',
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
          };
      firstFetch = false;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    return route.continue();
  });

  await page.route('**/api/interactions/int-7', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  await page.goto(`/contacts/${id}`);
  await expect(page.getByText('Coffee chat')).toBeVisible();

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete interaction' }).click();

  await expect(page.getByText('Coffee chat')).toHaveCount(0);
});
