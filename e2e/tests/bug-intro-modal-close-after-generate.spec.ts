// Covers bug: docs/bugs/intro-modal-missing-close-button-after-generate.md
// Per Flow 30 step 9, the post-generation modal must show three
// buttons: Copy, Send via email, Close.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const partyAId = '00000000-0000-0000-0000-00000030a000';
const partyBId = '00000000-0000-0000-0000-00000030b000';

test('intro modal shows a Close button after the draft is generated', async ({ page }) => {
  await page.route(`**/api/contacts/${partyAId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: partyAId,
          displayName: 'Alice Anchor',
          initials: 'AA',
          role: 'CEO',
          organization: 'Acme',
          location: null,
          tags: [],
          emails: ['alice@example.com'],
          phones: [],
          createdAt: '2025-12-01T00:00:00Z',
          starred: false,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/contacts/${partyAId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ready', summary: '', generatedAt: null }),
    }),
  );

  await page.route(/\/api\/contacts\?.*$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: partyAId, displayName: 'Alice Anchor', initials: 'AA', role: 'CEO', organization: 'Acme', tags: [] },
          { id: partyBId, displayName: 'Bob Bridge', initials: 'BB', role: 'CTO', organization: 'Beta', tags: [] },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 50,
      }),
    }),
  );

  await page.route('**/api/intro-drafts', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subject: 'Intro: Alice <> Bob', body: 'Hi both, quick intro…' }),
      });
    }
    return route.continue();
  });

  const email = `imc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${partyAId}`);

  await page.getByRole('button', { name: 'Draft intro' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('option', { name: 'Bob Bridge' }).click();
  await dialog.getByRole('button', { name: 'Generate draft' }).click();

  await expect(dialog.getByLabel('Draft body')).toHaveValue('Hi both, quick intro…');

  const closeBtn = dialog.getByRole('button', { name: 'Close' });
  await expect(closeBtn).toBeVisible();

  await closeBtn.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
