// Covers bug: docs/bugs/ask-failure-shows-raw-status.md
// A 429 from /api/ask must surface a friendly rate-limit message,
// not the internal identifier 'ask_failed_429'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Ask renders a friendly error when /api/ask returns 429', async ({ page }) => {
  const email = `askerr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 429,
      headers: { 'Retry-After': '60' },
      contentType: 'application/json',
      body: '{}',
    }),
  );

  await page.goto('/ask');

  const input = page.getByRole('textbox', { name: 'Ask anything' });
  await input.fill('what should I say?');
  await input.press('Enter');

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText(/ask_failed/);
  await expect(alert).toContainText(/too many/i);
});
