// Covers bug: docs/bugs/citation-card-missing-avatar.md
// Flow 20 — citation mini-cards must render an avatar with the
// contact's initials so they visually echo the contact pattern used
// elsewhere in the app.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"Sure"}\n\n' +
  'event: citations\ndata: {"items":[' +
  '{"contactId":"00000000-0000-0000-0000-000000020001","contactName":"Avery Smith","snippet":"talked about hiring","similarity":0.92,"source":"interaction"},' +
  '{"contactId":"00000000-0000-0000-0000-000000020002","contactName":"Bo","snippet":"founders dinner","similarity":0.81,"source":"contact"}' +
  ']}\n\n' +
  'event: done\ndata: {}\n\n';

test('citation mini-card renders avatar with computed initials', async ({ page }) => {
  await page.route('**/api/ask', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_BODY,
      });
    }
    return route.continue();
  });

  const email = `cav-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask anything' }).fill('who should I meet next?');
  await page.getByRole('button', { name: 'Send' }).click();

  const cards = page.getByTestId('citation-card');
  await expect(cards).toHaveCount(2);

  const firstAvatar = cards.first().locator('.avatar');
  await expect(firstAvatar).toBeVisible();
  await expect(firstAvatar).toHaveText('AS');

  const secondAvatar = cards.nth(1).locator('.avatar');
  await expect(secondAvatar).toBeVisible();
  await expect(secondAvatar).toHaveText('B');
});
