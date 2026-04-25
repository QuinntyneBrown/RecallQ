// Covers bug: docs/bugs/home-search-input-right-padding-mismatch.md
// Per docs/ui-design.pen Search Bar (lpCnN) padding [0, 18], the right
// padding should be 18px.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search input right padding is 18px', async ({ page }) => {
  const email = `srpd-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const input = page.locator('.search-input');
  await expect(input).toBeVisible();

  const padding = await input.evaluate(
    (el) => getComputedStyle(el).paddingRight,
  );
  expect(padding).toBe('18px');
});
