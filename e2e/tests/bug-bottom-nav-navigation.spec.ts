// Covers bug: docs/bugs/bottom-nav-tabs-do-not-navigate.md
// Bottom nav Home/Search/Ask tabs are <button>s without click
// handlers, so mobile visitors cannot reach /search or /ask from
// the nav. They must render as <a routerLink="...">, matching the
// Sidebar component.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test.describe('bottom nav navigates', () => {
  test.beforeEach(async ({ page }) => {
    const email = `nav-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');
    await expect(page).toHaveURL(/\/home$/);
  });

  for (const { label, path } of [
    { label: 'Home', path: '/home' },
    { label: 'Search', path: '/search' },
    { label: 'Ask', path: '/ask' },
  ]) {
    test(`${label} tab routes to ${path}`, async ({ page }) => {
      await page.goto('/home');
      await page.getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: label })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}(\\?|$)`));
    });
  }
});
