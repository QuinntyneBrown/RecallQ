// Covers bug: docs/bugs/ask-user-bubble-font-weight-not-500.md
// Per docs/ui-design.pen 1V5hQ (inside MeWfk uqBubble), the user
// question text is Inter 13/500. Implementation inherits 400.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask user bubble text renders at 500 weight', async ({ page }) => {
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

  const email = `aubw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('test');
  await page.getByRole('button', { name: 'Send' }).click();

  const bubble = page.getByTestId('user-bubble').first();
  await expect(bubble).toBeVisible({ timeout: 10_000 });

  const weight = await bubble.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(weight).toBe('500');
});
