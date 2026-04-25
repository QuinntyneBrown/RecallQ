// Covers bug: docs/bugs/home-hero-subtitle-margin-too-tight.md
// Per docs/ui-design.pen MXtnM the hero column lays children out
// with gap 14, so .hero-sub bottom and .hero-subtitle top must sit
// ~14px apart.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home hero subtitle sits 14px under the gradient line', async ({ page }) => {
  const email = `hsub-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const sub = page.locator('.hero-sub');
  const subtitle = page.locator('.hero-subtitle');
  await expect(sub).toBeVisible();
  await expect(subtitle).toBeVisible();

  const gap = await page.evaluate(() => {
    const a = document.querySelector('.hero-sub') as HTMLElement;
    const b = document.querySelector('.hero-subtitle') as HTMLElement;
    return b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
  });

  expect(gap).toBeGreaterThanOrEqual(13.5);
  expect(gap).toBeLessThanOrEqual(14.5);
});
