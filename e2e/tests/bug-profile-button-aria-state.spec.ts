// Covers bug: docs/bugs/profile-buttons-missing-aria-popup-state.md
// Bottom-nav and sidebar Profile buttons must announce their
// menu-button role via aria-haspopup + aria-expanded.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('bottom-nav Profile button exposes aria-haspopup and aria-expanded', async ({ page }) => {
  const email = `pap-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const profile = page.getByRole('navigation', { name: 'Main' })
    .getByRole('button', { name: 'Profile' });
  await expect(profile).toHaveAttribute('aria-haspopup', 'menu');
  await expect(profile).toHaveAttribute('aria-expanded', 'false');

  await profile.click();
  await expect(profile).toHaveAttribute('aria-expanded', 'true');
});

test('sidebar Profile button exposes aria-haspopup and aria-expanded', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });

  const email = `paps-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const profile = page.getByRole('navigation', { name: 'Sidebar' })
    .getByRole('button', { name: 'Profile' });
  await expect(profile).toHaveAttribute('aria-haspopup', 'menu');
  await expect(profile).toHaveAttribute('aria-expanded', 'false');

  await profile.click();
  await expect(profile).toHaveAttribute('aria-expanded', 'true');
});
