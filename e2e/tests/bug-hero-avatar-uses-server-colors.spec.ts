// Covers bug: docs/bugs/contact-detail-avatar-ignores-server-colors.md
// The hero avatar must honor the server's avatarColorA / B
// palette so each contact has a distinctive visual.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('hero avatar background gradient uses server colors when present', async ({ page }) => {
  const email = `av-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = '00000000-0000-0000-0000-0000000000ac';
  await page.route(`**/api/contacts/${id}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id,
          displayName: 'Palette Person',
          initials: 'PP',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          avatarColorA: '#FF0080',
          avatarColorB: '#0080FF',
          createdAt: '2025-12-15T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  await page.goto(`/contacts/${id}`);

  const avatar = page.getByTestId('hero-avatar');
  await expect(avatar).toBeVisible();
  const bg = await avatar.evaluate((el) => getComputedStyle(el).backgroundImage);
  // browsers normalise to rgb(...)
  expect(bg).toContain('rgb(255, 0, 128)');
  expect(bg).toContain('rgb(0, 128, 255)');
});
