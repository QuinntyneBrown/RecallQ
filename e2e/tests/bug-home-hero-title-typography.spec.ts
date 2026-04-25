// Covers bug: docs/bugs/home-find-anyone-hero-title-typography-mismatch.md
// Per docs/ui-design.pen node F2ZYi the home hero title `Find anyone.`
// should render at Geist 34/700 with letter-spacing -1.2px and
// line-height 1.05.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home `Find anyone.` matches ui-design.pen typography', async ({ page }) => {
  const email = `htyp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const title = page.locator('.hero-title');
  await expect(title).toHaveText('Find anyone.');

  const styles = await title.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      lineHeight: cs.lineHeight,
    };
  });

  expect(styles.fontSize).toBe('34px');
  expect(styles.fontWeight).toBe('700');
  expect(styles.letterSpacing).toBe('-1.2px');
  // 34 * 1.05 = 35.7 — browsers may round to 35.7 / 36 depending on rendering.
  const lh = parseFloat(styles.lineHeight);
  expect(lh).toBeGreaterThanOrEqual(35.5);
  expect(lh).toBeLessThanOrEqual(36);
});
