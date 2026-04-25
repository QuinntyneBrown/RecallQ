// Covers bug: docs/bugs/ask-from-contact-does-not-focus-input.md
// Flow 23 step 3 — after seeding from contactId / q, focus must
// land in the chat input so the user can edit or send immediately.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000002300';

test('ask page focuses the chat input after seeding from contactId', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Carol Contact',
          initials: 'CC',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  const email = `afc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/ask?contactId=${contactId}`);

  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await expect(input).toHaveValue('What should I say to Carol Contact next?');
  await expect(input).toBeFocused();
});

test('ask page focuses the chat input after seeding from q param', async ({ page }) => {
  const email = `afq-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask?q=' + encodeURIComponent('hello there'));

  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await expect(input).toHaveValue('hello there');
  await expect(input).toBeFocused();
});
