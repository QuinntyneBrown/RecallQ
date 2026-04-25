// Covers bug: docs/bugs/citation-card-name-font-size-too-large.md
// Per docs/ui-design.pen lUPJg (citation card name), the contact name
// renders at 12px. Implementation paints at 14px.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"hello"}\n\n' +
  'event: citations\ndata: {"items":[' +
  '{"contactId":"00000000-0000-0000-0000-000000000001","contactName":"Alice","similarity":0.91,"snippet":"top hit"}' +
  ']}\n\n' +
  'event: done\ndata: {}\n\n';

test('citation card name font-size is 12px', async ({ page }) => {
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

  const email = `cnf-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const card = page.getByTestId('citation-card').first();
  await expect(card).toBeVisible({ timeout: 10_000 });

  const name = card.locator('.row strong');
  const size = await name.evaluate((el) => getComputedStyle(el).fontSize);
  expect(size).toBe('12px');
});
