// Covers bug: docs/bugs/all-activity-page-is-a-stub.md
// The full activity view must fetch and render interactions, not
// render a 'coming soon' placeholder.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('activity page renders interactions from the list endpoint', async ({ page }) => {
  const email = `act-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Activity Target', initials: 'AT' });

  const payload = {
    items: [
      {
        id: 'int-1',
        contactId: id,
        type: 'email',
        occurredAt: '2025-12-15T10:00:00Z',
        subject: 'Kickoff email',
        content: 'hello world',
        createdAt: '2025-12-15T10:00:00Z',
      },
      {
        id: 'int-2',
        contactId: id,
        type: 'call',
        occurredAt: '2025-12-14T10:00:00Z',
        subject: 'Intro call',
        content: 'we chatted',
        createdAt: '2025-12-14T10:00:00Z',
      },
    ],
    nextPage: null,
  };

  await page.route(`**/api/contacts/${id}/interactions*`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) }),
  );

  await page.goto(`/contacts/${id}/activity`);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('All activity');
  await expect(page.getByText('coming soon')).toHaveCount(0);
  await expect(page.getByText('Kickoff email')).toBeVisible();
  await expect(page.getByText('Intro call')).toBeVisible();
});
