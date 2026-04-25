// Covers bug: docs/bugs/sidebar-profile-menu-no-outside-click-dismiss.md
// At MD+ viewports the sidebar is shown instead of the bottom
// nav; its Profile menu must dismiss on outside click.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('sidebar profile menu closes on outside click', async ({ page }) => {
  // Bump viewport above the MD breakpoint so the sidebar renders.
  await page.setViewportSize({ width: 1024, height: 768 });

  const email = `sbpm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  await page.getByRole('navigation', { name: 'Sidebar' })
    .getByRole('button', { name: 'Profile' })
    .click();

  const logoutItem = page.getByRole('menuitem', { name: 'Log out' });
  await expect(logoutItem).toBeVisible();

  await page.locator('main').click({ position: { x: 200, y: 200 } });

  await expect(logoutItem).toHaveCount(0);
});
