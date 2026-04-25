// Covers bug: docs/bugs/search-error-banner-purple-not-red.md
// Mock /api/search to fail so the .error banner renders, then assert
// it computes red background and text per the design's error language.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('search error banner paints red, not magenta', async ({ page }) => {
  const email = `serr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/search', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: '{"error":"server_error"}',
    });
  });

  await page.goto('/search?q=hello');

  const err = page.locator('.error[role="alert"]');
  await expect(err).toBeVisible({ timeout: 10_000 });

  const styles = await err.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, backgroundColor: cs.backgroundColor };
  });

  // text #FFB3B3 -> rgb(255, 179, 179)
  expect(styles.color).toBe('rgb(255, 179, 179)');
  // background uses #FF6B6B at 15% alpha. Chromium serialises the
  // color-mix as `color(srgb r g b / a)`. Just check it includes the
  // #FF6B6B channel signature.
  expect(styles.backgroundColor).toMatch(/(255,\s*107,\s*107|0\.99\d+\s+0\.41\d+\s+0\.41\d+)/);
});
