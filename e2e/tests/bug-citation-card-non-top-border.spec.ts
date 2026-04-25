// Covers bug: docs/bugs/citation-card-non-top-border-transparent.md
// Per docs/ui-design.pen, citation mini cards 2/3 (9qiUY, bLNk8) wear
// a $border-subtle stroke. Implementation paints transparent so they
// lose containment.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"hello"}\n\n' +
  'event: citations\ndata: {"items":[' +
  '{"contactId":"00000000-0000-0000-0000-000000000001","contactName":"Alice","similarity":0.91,"snippet":"top hit"},' +
  '{"contactId":"00000000-0000-0000-0000-000000000002","contactName":"Bob","similarity":0.74,"snippet":"second hit"}' +
  ']}\n\n' +
  'event: done\ndata: {}\n\n';

test('non-top citation card uses --border-subtle border', async ({ page }) => {
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

  const email = `cnb-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const cards = page.getByTestId('citation-card');
  await expect(cards.nth(1)).toBeVisible({ timeout: 10_000 });

  const second = await cards.nth(1).evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: cs.borderTopWidth,
      style: cs.borderTopStyle,
      color: cs.borderTopColor,
    };
  });

  expect(second.width).toBe('1px');
  expect(second.style).toBe('solid');
  // --border-subtle = #26263F -> rgb(38, 38, 63)
  expect(second.color).toBe('rgb(38, 38, 63)');
});
