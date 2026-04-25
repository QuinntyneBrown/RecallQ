// Covers bug: docs/bugs/home-search-placeholder-color-not-design-token.md
// Per docs/ui-design.pen Search Bar (lpCnN → l9VNc) the placeholder is
// rendered in the design's muted lavender. The token --foreground-muted
// (#8E8EB5, WCAG-bumped from #6E6E8F) is the project's expression of
// that intent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search placeholder paints with --foreground-muted', async ({ page }) => {
  const email = `phcl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const input = page.locator('.search-input');
  await expect(input).toBeVisible();

  const placeholderColor = await input.evaluate((el) => {
    const cs = window.getComputedStyle(el, '::placeholder');
    return cs.color;
  });

  // --foreground-muted is #8E8EB5 -> rgb(142, 142, 181)
  expect(placeholderColor).toBe('rgb(142, 142, 181)');
});
