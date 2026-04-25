// Covers bug: docs/bugs/ask-follow-up-chip-leaves-draft-in-input.md
// Flow 21 — tapping a chip is "calls submit(chipText)", which means
// the input/draft must be cleared just like a manual send.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"Hi"}\n\n' +
  'event: followups\ndata: {"items":["How did you meet?"]}\n\n' +
  'event: done\ndata: {}\n\n';

test('tapping a follow-up chip clears the input draft', async ({ page }) => {
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

  const email = `fud-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await input.fill('first question');
  await page.getByRole('button', { name: 'Send' }).click();

  const chip = page.getByTestId('follow-up-chip').first();
  await expect(chip).toBeVisible();

  await input.fill('stale draft');
  await expect(input).toHaveValue('stale draft');

  await chip.click();

  await expect(input).toHaveValue('');
});
