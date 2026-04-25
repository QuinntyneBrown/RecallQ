// Covers bug: docs/bugs/ask-user-bubble-gradient-end-stop-too-pink.md
// Per docs/ui-design.pen MeWfk uqBubble, the user question bubble paints
// a 135deg purple-to-magenta gradient: #7C3AFF -> #BF40FF.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask user bubble gradient ends in magenta', async ({ page }) => {
  await page.route('**/api/ask', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: token\ndata: {"token":"hi"}\n\nevent: done\ndata: {}\n\n',
      });
    }
    return route.continue();
  });

  const email = `aub-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const bubble = page.getByTestId('user-bubble').first();
  await expect(bubble).toBeVisible({ timeout: 10_000 });

  const bg = await bubble.evaluate((el) => getComputedStyle(el).backgroundImage);
  // 135deg, #7C3AFF -> #BF40FF
  expect(bg).toContain('linear-gradient(135deg');
  expect(bg).toContain('rgb(124, 58, 255)'); // start
  expect(bg).toContain('rgb(191, 64, 255)'); // mid (the design end stop)
  expect(bg).not.toContain('rgb(255, 94, 231)'); // gradient-end pink (NOT in spec)
});
