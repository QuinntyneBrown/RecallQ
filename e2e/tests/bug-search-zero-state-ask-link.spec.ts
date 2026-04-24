// Covers bug: docs/bugs/search-zero-state-ask-link-loses-query.md
// A query that matches nothing must hand off to /ask with ?q=<query>
// so the visitor's prompt survives into Ask mode.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('zero-state Ask link carries the query to /ask', async ({ page }) => {
  const email = `zero-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const q = 'nobody-here-will-ever-match-this-' + Date.now();
  await page.goto(`/search?q=${encodeURIComponent(q)}`);

  const zero = page.getByTestId('zero-state');
  await expect(zero).toBeVisible();
  await expect(zero.getByRole('heading')).toHaveText('No matches yet');

  await zero.getByRole('link', { name: /ask recallq/i }).click();

  await expect(page).toHaveURL(new RegExp(`/ask\\?(?:[^&]*&)*q=${encodeURIComponent(q)}(?:&|$)`));
});
