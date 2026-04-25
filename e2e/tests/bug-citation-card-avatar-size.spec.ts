// Covers bug: docs/bugs/citation-card-avatar-too-small.md
// Per docs/ui-design.pen 9ymIG (mini-avatar inside citation card RZb87),
// the avatar circle is 32x32. Implementation renders it at 28x28.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"hello"}\n\n' +
  'event: citations\ndata: {"items":[' +
  '{"contactId":"00000000-0000-0000-0000-000000000001","contactName":"Alice","similarity":0.91,"snippet":"top hit"}' +
  ']}\n\n' +
  'event: done\ndata: {}\n\n';

test('citation card avatar is 32x32', async ({ page }) => {
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

  const email = `cas-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const card = page.getByTestId('citation-card').first();
  await expect(card).toBeVisible({ timeout: 10_000 });

  const avatar = card.locator('.avatar');
  const dims = await avatar.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.width, height: cs.height };
  });

  expect(dims.width).toBe('32px');
  expect(dims.height).toBe('32px');
});
