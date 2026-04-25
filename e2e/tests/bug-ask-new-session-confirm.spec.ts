// Covers bug: docs/bugs/ask-new-session-wipes-without-confirmation.md
// The '+' button on Ask must prompt for confirmation before wiping
// the conversation when at least one message exists.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Ask new-session prompts confirm and dismiss preserves messages', async ({ page }) => {
  const email = `askns-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Short-circuit the SSE endpoint with a minimal stream so submit()
  // adds a user bubble and completes cleanly.
  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: 'event: message\ndata: {"token":"Hi"}\n\nevent: done\ndata: {}\n\n',
    }),
  );

  await page.goto('/ask');

  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await input.fill('hello');
  await input.press('Enter');

  await expect(page.getByTestId('user-bubble')).toBeVisible();

  // Dismiss the confirm dialog — messages must survive.
  let dialogSeen = false;
  page.once('dialog', (d) => {
    dialogSeen = true;
    void d.dismiss();
  });
  await page.getByRole('button', { name: 'New session' }).click();

  expect(dialogSeen).toBe(true);
  await expect(page.getByTestId('user-bubble')).toBeVisible();
});
