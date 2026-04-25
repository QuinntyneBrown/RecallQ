// Covers bug: docs/bugs/sort-menu-not-disabled-when-no-query.md
// Per Flow 16, the sort control must be disabled when no query
// is set.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('sort menu trigger is disabled on /search with no query', async ({ page }) => {
  const email = `srt-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/search');

  const trigger = page.getByTestId('sort-menu-trigger');
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeDisabled();
});
