// Covers bug: docs/bugs/search-rate-limit-shows-raw-status.md
// Per Flow 15 alternatives, a 429 from /api/search must surface a
// friendly rate-limit message instead of the raw status string.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('search renders friendly copy when /api/search returns 429', async ({ page }) => {
  const email = `srl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/search', (route) =>
    route.fulfill({
      status: 429,
      headers: { 'Retry-After': '60' },
      contentType: 'application/json',
      body: '{}',
    }),
  );

  await page.goto('/search?q=anyone');

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText(/search_failed/);
  await expect(alert).toContainText(/too many/i);
});
