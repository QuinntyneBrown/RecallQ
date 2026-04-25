// Covers bug: docs/bugs/ask-streaming-error-event-not-handled.md
// Flow 19 — when the SSE stream emits event:error mid-response the
// SPA must keep the partial answer and show a retry chip.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const ERROR_SSE =
  'event: token\ndata: {"token":"Sure—"}\n\n' +
  'event: error\ndata: "llm_failed"\n\n';

const RECOVER_SSE =
  'event: token\ndata: {"token":"Recovered"}\n\n' +
  'event: done\ndata: {}\n\n';

test('ask error event shows retry chip; retry re-asks the prior question', async ({ page }) => {
  let askHits = 0;
  const seenBodies: string[] = [];
  await page.route('**/api/ask', (route) => {
    if (route.request().method() === 'POST') {
      askHits++;
      seenBodies.push(route.request().postData() ?? '');
      const body = askHits === 1 ? ERROR_SSE : RECOVER_SSE;
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    }
    return route.continue();
  });

  const email = `aer-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await page.getByRole('textbox', { name: 'Ask a question' }).fill('what about Avery?');
  await page.getByRole('button', { name: 'Send' }).click();

  const bubble = page.getByTestId('assistant-bubble').first();
  await expect(bubble).toContainText('Sure—');

  const retry = page.getByTestId('ask-retry');
  await expect(retry).toBeVisible();

  await retry.click();

  await expect.poll(() => askHits, { timeout: 5000 }).toBeGreaterThanOrEqual(2);
  expect(seenBodies[1]).toContain('what about Avery?');
});
