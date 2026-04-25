// Covers bug: docs/bugs/register-page-typography-and-gap-mismatch.md
// Per docs/ui-design.pen 8qbab + 5KjFh, the register column gap is 32
// and the heading is Geist 32/700 with -0.8px tracking.
import { test, expect } from '@playwright/test';

test('register page column gap and heading match ui-design.pen', async ({ page }) => {
  await page.goto('/register');

  const section = page.locator('section.page');
  await expect(section).toBeVisible();

  const gap = await section.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('32px');

  const h1 = page.getByRole('heading', { name: 'Create account' });
  await expect(h1).toBeVisible();
  const styles = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });
  expect(styles.fontSize).toBe('32px');
  expect(styles.letterSpacing).toBe('-0.8px');
});
