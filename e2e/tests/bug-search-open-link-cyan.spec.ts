// Covers bug: docs/bugs/search-open-link-purple-not-cyan.md
// The .open-link only renders in the desktop detail pane (>= lg
// viewport), so the test forces lg and seeds a contact + search.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';
import { VIEWPORTS } from '../fixtures/viewports';

test.use({ viewport: VIEWPORTS.lg });

test('search Open-full-profile link is cyan', async ({ page }) => {
  const email = `solnk-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });
  await api(page).addContact({ displayName: 'Bob Carter', initials: 'BC' });

  await page.goto('/search?q=Sarah');

  // Click the first result so the detail pane populates.
  const card = page.locator('[data-testid="result-card"]').first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  const link = page.locator('.open-link').first();
  await expect(link).toBeVisible({ timeout: 5_000 });

  const color = await link.evaluate((el) => getComputedStyle(el).color);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
