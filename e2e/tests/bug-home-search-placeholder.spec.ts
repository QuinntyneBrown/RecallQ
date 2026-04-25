// Covers bug: docs/bugs/home-search-placeholder-mismatch.md
// Per docs/ui-design.pen Search Bar (lpCnN → l9VNc), the home
// search input placeholder must read 'Search by meaning...'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search placeholder matches ui-design.pen', async ({ page }) => {
  const email = `srpl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const search = page.getByRole('searchbox', { name: 'Search contacts' });
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute('placeholder', 'Search by meaning...');
});
