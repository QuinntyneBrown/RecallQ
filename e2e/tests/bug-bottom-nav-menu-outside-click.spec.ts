// Covers bug: docs/bugs/bottom-nav-profile-menu-no-outside-click-dismiss.md
// The bottom-nav profile menu must dismiss when the visitor
// clicks outside the menu container.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('bottom-nav profile menu closes on outside click', async ({ page }) => {
  const email = `pm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  await page.getByRole('navigation', { name: 'Main' })
    .getByRole('button', { name: 'Profile' })
    .click();

  const logoutItem = page.getByRole('menuitem', { name: 'Log out' });
  await expect(logoutItem).toBeVisible();

  // Click somewhere outside the profile menu — the page main content.
  await page.locator('main').click({ position: { x: 100, y: 100 } });

  await expect(logoutItem).toHaveCount(0);
});
