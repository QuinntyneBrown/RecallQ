// Covers bug: docs/bugs/home-indicator-pill-width-too-wide.md
// Per docs/ui-design.pen Home Indicator (JRdjy → nNWch) the pill is
// 134px wide. The xs viewport (375x667) renders the home-indicator
// (it only mounts when the bottom-nav mounts).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home indicator pill is 134px wide', async ({ page }) => {
  const email = `hipw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const pill = page.locator('[data-testid="home-indicator"] .pill');
  await expect(pill).toBeVisible();

  const width = await pill.evaluate((el) => getComputedStyle(el).width);
  expect(width).toBe('134px');
});
