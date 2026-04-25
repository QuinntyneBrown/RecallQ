// Covers bug: docs/bugs/logout-leaves-ask-history-in-memory.md
// After logout the SPA must clear AskService.messages so the next
// user opening /ask sees only the greeting bubble.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const SSE_BODY =
  'event: token\ndata: {"token":"Hi there"}\n\n' +
  'event: done\ndata: {}\n\n';

test('logout clears prior ask chat history', async ({ page }) => {
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

  const emailA = `lah-a-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, emailA, 'correcthorse12');

  await page.goto('/ask');
  await page.getByRole('textbox', { name: 'Ask a question' }).fill('user A question');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByTestId('user-bubble')).toHaveCount(1);

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login(\?|$)/);

  const emailB = `lah-b-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, emailB, 'correcthorse12');

  await page.goto('/ask');
  await expect(page.getByTestId('greet-bubble')).toBeVisible();
  await expect(page.getByTestId('user-bubble')).toHaveCount(0);
  await expect(page.getByTestId('assistant-bubble')).toHaveCount(0);
});
