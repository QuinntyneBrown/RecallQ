// Covers bug: docs/bugs/home-greeting-to-headline-gap-too-tight.md
// Per docs/ui-design.pen frame MXtnM the hero column lays children
// out vertically with gap 14, so .greeting and .hero-title must sit
// at least 14px apart at their box edges.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home greeting sits 14px above the headline', async ({ page }) => {
  const email = `gphd-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const greeting = page.locator('.greeting');
  const title = page.locator('.hero-title');
  await expect(greeting).toBeVisible();
  await expect(title).toBeVisible();

  const gap = await page.evaluate(() => {
    const g = document.querySelector('.greeting') as HTMLElement;
    const t = document.querySelector('.hero-title') as HTMLElement;
    return t.getBoundingClientRect().top - g.getBoundingClientRect().bottom;
  });

  // Allow ±0.5px for sub-pixel rounding.
  expect(gap).toBeGreaterThanOrEqual(13.5);
  expect(gap).toBeLessThanOrEqual(14.5);
});
