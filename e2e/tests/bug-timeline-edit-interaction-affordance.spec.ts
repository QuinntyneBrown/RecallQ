// Covers bug: docs/bugs/timeline-has-no-edit-interaction-affordance.md
// Flow 13 — Update Interaction. Timeline must expose an Edit button
// that routes to an edit page that PATCHes via the interactions API.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('timeline Edit button routes to edit page that PATCHes the interaction', async ({ page }) => {
  const contactId = '00000000-0000-0000-0000-0000000013ed';
  const interactionId = '11111111-1111-1111-1111-1111111113ed';

  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Edit Target',
          initials: 'ET',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [
            {
              id: interactionId,
              contactId,
              type: 'note',
              occurredAt: '2026-04-20T10:30:00Z',
              subject: 'Original subject',
              content: 'Original content',
              createdAt: '2026-04-20T10:30:00Z',
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

  let patchBody: Record<string, unknown> | null = null;
  await page.route(`**/api/interactions/${interactionId}`, (route) => {
    if (route.request().method() === 'PATCH') {
      patchBody = JSON.parse(route.request().postData() ?? '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: interactionId,
          contactId,
          type: 'note',
          occurredAt: '2026-04-20T10:30:00Z',
          subject: 'Updated subject',
          content: 'Original content',
          createdAt: '2026-04-20T10:30:00Z',
        }),
      });
    }
    return route.continue();
  });

  const email = `eix-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);

  const editBtn = page.getByRole('button', { name: 'Edit interaction' }).first();
  await expect(editBtn).toBeVisible();

  await editBtn.click();

  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}/interactions/${interactionId}/edit$`));

  const subjectInput = page.getByLabel('Subject');
  await expect(subjectInput).toHaveValue('Original subject');

  await subjectInput.fill('Updated subject');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => patchBody).not.toBeNull();
  expect(patchBody!['subject']).toBe('Updated subject');

  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));
});
