// Covers bug: docs/bugs/bottom-nav-background-not-translucent.md
// Per docs/ui-design.pen Bottom Nav (f4T0y), the background is
// #0A0A16E6 — rgba(10, 10, 22, 0.9).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('bottom nav background is 90% translucent', async ({ page }) => {
  const email = `bnbg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const nav = page.locator('.bottom-nav');
  await expect(nav).toBeVisible();

  const bg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
  // rgba(10, 10, 22, 0.9) — Chromium normalises to "rgba(10, 10, 22, 0.9)".
  expect(bg).toBe('rgba(10, 10, 22, 0.9)');
});
