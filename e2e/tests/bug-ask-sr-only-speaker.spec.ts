// Covers bug: docs/bugs/ask-bubbles-missing-sr-only-speaker-prefixes.md
// Flow 41 step 2 wants 'You said:' (and similarly 'RecallQ said:')
// in the live-region announcement.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Ask user bubble carries a sr-only "You said:" speaker prefix', async ({ page }) => {
  const email = `sr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

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

  const userBubble = page.getByTestId('user-bubble');
  await expect(userBubble).toBeVisible();
  await expect(userBubble).toContainText('You said:');
});
