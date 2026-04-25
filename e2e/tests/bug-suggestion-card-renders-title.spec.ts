// Covers bug: docs/bugs/suggestion-card-never-renders-title.md
// suggestion-card must render Suggestion.title as a heading above
// the body so users see the AI's one-phrase summary.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('suggestion-card renders title heading above body', async ({ page }) => {
  const email = `sgt-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/suggestions', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000002525',
          key: 'silent-warm-x',
          kind: 'silent_warm',
          title: 'Gone quiet',
          body: "You've gone quiet with Avery — worth a check-in?",
          actionLabel: 'Open contact',
          actionHref: '/contacts/x',
        }),
      });
    }
    return route.continue();
  });

  await page.goto('/home');

  const card = page.getByTestId('suggestion-card');
  await expect(card).toBeVisible();

  const title = card.getByRole('heading', { name: 'Gone quiet' });
  await expect(title).toBeVisible();

  await expect(card.getByText("You've gone quiet with Avery — worth a check-in?")).toBeVisible();
});
