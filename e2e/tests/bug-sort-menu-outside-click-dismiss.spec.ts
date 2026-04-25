// Covers bug: docs/bugs/sort-menu-no-outside-click-dismiss.md
// SortMenuComponent must close its role="menu" popup when the user
// clicks outside the host element, matching the bottom-nav and
// sidebar Profile menu fixes.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('sort menu closes on outside click', async ({ page }) => {
  await page.route('**/api/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], nextPage: null, contactsMatched: 0 }),
    }),
  );

  const email = `sm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/search?q=anything');

  await page.getByTestId('sort-menu-trigger').click();
  await expect(page.getByTestId('sort-menu')).toBeVisible();

  await page.locator('main').click({ position: { x: 50, y: 200 } });

  await expect(page.getByTestId('sort-menu')).toHaveCount(0);
});
