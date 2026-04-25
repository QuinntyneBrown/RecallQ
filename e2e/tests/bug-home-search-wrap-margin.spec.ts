// Covers bug: docs/bugs/home-search-wrap-margin-top-too-tight.md
// Per docs/ui-design.pen positions, the search bar sits well below
// the hero column. Implementation should hold at least 24px between
// .hero-subtitle bottom and .search-wrap top so the hero block and
// the primary affordance read as two beats.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search bar holds 24px of breath under the subtitle', async ({ page }) => {
  const email = `swmg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const subtitle = page.locator('.hero-subtitle');
  const wrap = page.locator('.search-wrap');
  await expect(subtitle).toBeVisible();
  await expect(wrap).toBeVisible();

  const gap = await page.evaluate(() => {
    const a = document.querySelector('.hero-subtitle') as HTMLElement;
    const b = document.querySelector('.search-wrap') as HTMLElement;
    return b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
  });

  expect(gap).toBeGreaterThanOrEqual(23.5);
  expect(gap).toBeLessThanOrEqual(24.5);
});
