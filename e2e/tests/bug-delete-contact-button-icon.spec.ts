// Covers bug: docs/bugs/delete-contact-button-shows-dots-icon.md
// The Delete contact button must visually communicate destruction
// — i.e. its icon must be a trash, not the "more menu" dots glyph.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000000909';

test('Delete contact button icon is ph-trash, not ph-dots-three', async ({ page }) => {
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Trash Test',
          initials: 'TT',
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

  await page.route(`**/api/contacts/${contactId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ready', summary: '', generatedAt: null }),
    }),
  );

  const email = `dci-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);
  await expect(page.getByTestId('hero-name')).toHaveText('Trash Test', { timeout: 15_000 });

  const icon = page.getByRole('button', { name: 'Delete contact' }).locator('i');
  await expect(icon).toHaveClass(/ph-trash/);
  await expect(icon).not.toHaveClass(/ph-dots-three/);
});
