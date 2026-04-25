// Covers bug: docs/bugs/suggestion-dismiss-not-optimistic.md
// Per Flow 25 step 5, the SPA must hide the suggestion card
// immediately when the user taps Dismiss, even if the POST fails.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('Dismiss hides the card immediately even when the POST fails', async ({ page }) => {
  const email = `sug-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/suggestions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'sug-1',
        key: 'find-similar-investors',
        kind: 'Query',
        title: 'AI founders this week',
        body: 'You met 3 AI founders last week — shall I find similar investors?',
        actionLabel: 'Find similar investors',
        actionHref: '/search?q=ai+founders',
      }),
    }),
  );

  await page.route('**/api/suggestions/*/dismiss', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/home');
  await expect(page.getByTestId('suggestion-card')).toBeVisible();

  await page.getByRole('button', { name: 'Dismiss' }).click();

  await expect(page.getByTestId('suggestion-card')).toHaveCount(0);
});
