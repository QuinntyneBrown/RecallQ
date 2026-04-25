// Covers bug: docs/bugs/follow-up-chip-font-weight-not-500.md
// Per docs/ui-design.pen vxCOm (inside CLlz8 fu1), the follow-up
// chip label is Inter 12/500. Buttons default to 400 — assert the
// component sets the medium weight explicitly.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"Hi"}\n\n' +
  'event: followups\ndata: {"items":["Draft pitch to Sarah"]}\n\n' +
  'event: done\ndata: {}\n\n';

test('follow-up chip label renders at 500 weight', async ({ page }) => {
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

  const email = `fcw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const chip = page.getByTestId('follow-up-chip').first();
  await expect(chip).toBeVisible({ timeout: 10_000 });

  const weight = await chip.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(weight).toBe('500');
});
