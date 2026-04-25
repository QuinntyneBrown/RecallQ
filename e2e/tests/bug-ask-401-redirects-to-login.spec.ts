// Covers bug: docs/bugs/ask-401-does-not-redirect-to-login.md
// Flow 19 — when /api/ask returns 401 (session expired mid-session),
// the SPA must clear its auth state and route to /login?returnUrl=...
// so the user can re-authenticate. The HttpClient interceptor only
// handles 401 for HttpClient calls; AskService uses raw fetch and
// previously left users stuck on /ask.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('401 from /api/ask redirects user to /login with returnUrl', async ({ page }) => {
  const email = `a401-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  // Stub /api/ask to respond 401, simulating an expired session.
  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_credentials' }),
    }),
  );

  // Type a question and send.
  const input = page.getByLabel('Ask a question');
  await input.fill('Will this redirect?');
  await page.getByRole('button', { name: 'Send' }).click();

  // After 401 the SPA should land on /login (with optional returnUrl=/ask).
  await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 15_000 });

  // Sanity: the returnUrl should preserve where they were so the
  // post-login redirect lands them back on /ask.
  expect(page.url()).toContain('returnUrl=');
});
