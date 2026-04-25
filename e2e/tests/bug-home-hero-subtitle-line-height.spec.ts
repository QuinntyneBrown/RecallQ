// Covers bug: docs/bugs/home-hero-subtitle-line-height-not-set.md
// Per docs/ui-design.pen node iLRLS, .hero-subtitle line-height must
// be 1.45. With font-size 14px that resolves to 20.3px.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home hero subtitle line-height is 1.45 per design', async ({ page }) => {
  const email = `hslh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const subtitle = page.locator('.hero-subtitle');
  await expect(subtitle).toBeVisible();

  const lineHeightStr = await subtitle.evaluate(
    (el) => getComputedStyle(el).lineHeight,
  );

  // Computed line-height for `1.45` on a 14px font resolves to either
  // "20.3px" / "20.30px" or the unitless "1.45" depending on the
  // engine. Either form is acceptable; the unset/`normal` default that
  // the bug describes resolves to "normal".
  const px = parseFloat(lineHeightStr);
  const ratio = lineHeightStr.includes('px') ? px / 14 : px;
  expect(Number.isFinite(ratio)).toBe(true);
  expect(ratio).toBeGreaterThanOrEqual(1.44);
  expect(ratio).toBeLessThanOrEqual(1.46);
});
