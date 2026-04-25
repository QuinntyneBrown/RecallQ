// Covers bug: docs/bugs/ask-follow-up-eyebrow-not-cyan.md
// Per docs/ui-design.pen kX2bU (inside 04PeS followHead), the
// "FOLLOW-UP" eyebrow paints in $accent-tertiary cyan, not muted grey.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"Hello"}\n\n' +
  'event: followups\ndata: {"items":["What did we discuss?"]}\n\n' +
  'event: done\ndata: {}\n\n';

test('FOLLOW-UP eyebrow on ask page renders in cyan', async ({ page }) => {
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

  const email = `afe-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test q');
  await page.getByRole('button', { name: 'Send' }).click();

  const label = page.locator('.follow-up-label');
  await expect(label).toBeVisible({ timeout: 10_000 });
  await expect(label).toHaveText('FOLLOW-UP');

  const color = await label.evaluate((el) => getComputedStyle(el).color);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
