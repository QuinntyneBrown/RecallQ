// Covers bug: docs/bugs/add-contact-user-typed-initials-not-uppercase.md
// Whether the visitor types initials or lets the page derive them,
// the value held by the form must be uppercased before submit.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('add-contact uppercases user-typed initials', async ({ page }) => {
  const email = `init-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  let capturedInitials: string | undefined;
  await page.route('**/api/contacts', (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      capturedInitials = body.initials;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-0000000000af',
          displayName: body.displayName ?? '',
          initials: body.initials ?? '',
          role: null,
          organization: null,
          location: null,
          tags: [],
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
  await page.getByLabel('Display name').fill('Lower Case Person');
  // Override the auto-derived initials with lowercase input.
  const initialsInput = page.getByLabel('Initials');
  await initialsInput.fill('abc');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => capturedInitials).toBe('ABC');
});
