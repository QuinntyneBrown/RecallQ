// Covers bug: docs/bugs/add-contact-pending-tag-lost-on-submit.md
// On Save, any non-empty tag input must be folded into the
// payload's tags array even if the visitor never pressed Enter.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('add-contact commits pending tag input on Save', async ({ page }) => {
  const email = `tag-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  let capturedTags: string[] | undefined;
  await page.route('**/api/contacts', async (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      capturedTags = body.tags;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-0000000000ab',
          displayName: body.displayName ?? '',
          initials: body.initials ?? '',
          role: null,
          organization: null,
          location: null,
          tags: body.tags ?? [],
          emails: [],
          phones: [],
          avatarColorA: null,
          avatarColorB: null,
          createdAt: '2025-12-15T00:00:00Z',
        }),
      });
    }
    return route.continue();
  });

  await page.goto('/contacts/new');
  await page.getByLabel('Display name').fill('Tag Target');
  await page.getByLabel('Initials').fill('TT');
  await page.getByLabel('Tags').fill('important');
  // Intentionally do NOT press Enter.
  await page.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => capturedTags).toEqual(['important']);
});
