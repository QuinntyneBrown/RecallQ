// Covers bug: docs/bugs/home-hero-title-sub-gap-not-2px.md
// Per docs/ui-design.pen frame TizXT, the inner heroTitleRow lays
// `Find anyone.` and `By meaning, not memory.` with a 2px gap.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home hero title and sub lines hold a 2px gap', async ({ page }) => {
  const email = `htsg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const title = page.locator('.hero-title');
  const sub = page.locator('.hero-sub');
  await expect(title).toBeVisible();
  await expect(sub).toBeVisible();

  const gap = await page.evaluate(() => {
    const t = document.querySelector('.hero-title') as HTMLElement;
    const s = document.querySelector('.hero-sub') as HTMLElement;
    return s.getBoundingClientRect().top - t.getBoundingClientRect().bottom;
  });

  expect(gap).toBeGreaterThanOrEqual(1.5);
  expect(gap).toBeLessThanOrEqual(2.5);
});
