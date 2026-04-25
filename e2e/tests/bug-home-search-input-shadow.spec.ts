// Covers bug: docs/bugs/home-search-input-shadow-too-weak.md
// Per docs/ui-design.pen Search Bar (lpCnN), the input pill must
// carry a 16px-blur shadow at rgba(0,0,0,0.3) offset y=4.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search input matches the design pen shadow', async ({ page }) => {
  const email = `shdw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const input = page.locator('.search-input');
  await expect(input).toBeVisible();

  const shadow = await input.evaluate((el) => getComputedStyle(el).boxShadow);
  // rgba(0,0,0,0.3) 0 4 16 0 — Chromium normalises to "rgba(0, 0, 0, 0.3) 0px 4px 16px 0px".
  expect(shadow).toContain('rgba(0, 0, 0, 0.3)');
  expect(shadow).toContain('4px');
  expect(shadow).toContain('16px');
});
