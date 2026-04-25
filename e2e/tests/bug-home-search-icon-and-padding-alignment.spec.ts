// Covers bug: docs/bugs/home-search-icon-left-and-input-left-padding-off-by-2.md
// Per docs/ui-design.pen Search Bar (lpCnN) padding [0, 18] + gap 12,
// the leading icon sits at 18 from the input edge and the text starts
// at 50.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search icon left and input padding-left match design', async ({ page }) => {
  const email = `silp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const icon = page.locator('.search-icon');
  const input = page.locator('.search-input');
  await expect(icon).toBeVisible();
  await expect(input).toBeVisible();

  const iconLeft = await icon.evaluate((el) => getComputedStyle(el).left);
  const paddingLeft = await input.evaluate((el) => getComputedStyle(el).paddingLeft);

  expect(iconLeft).toBe('18px');
  expect(paddingLeft).toBe('50px');
});
