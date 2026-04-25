// Covers bug: docs/bugs/stacks-with-zero-count-are-rendered.md
// Per Flow 24 step 5, stacks with count = 0 must be hidden by the
// SPA. Currently every stack in the response renders.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home hides Smart Stacks with count = 0', async ({ page }) => {
  const email = `stk-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/stacks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a', name: 'AI founders', kind: 'Tag', count: 12 },
        { id: 'b', name: 'Close friends', kind: 'Tag', count: 0 },
        { id: 'c', name: 'Intros owed', kind: 'Query', count: 3 },
      ]),
    }),
  );

  await page.goto('/home');

  const cards = page.getByTestId('stack-card');
  await expect(cards).toHaveCount(2);
  await expect(page.getByText('Close friends')).toHaveCount(0);
  await expect(page.getByText('AI founders')).toBeVisible();
  await expect(page.getByText('Intros owed')).toBeVisible();
});
