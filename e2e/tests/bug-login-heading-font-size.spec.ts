// Covers bug: docs/bugs/login-heading-font-size-mismatch.md
// Per docs/ui-design.pen node G5WFb, the `Sign in` heading is 32px
// with -0.8px tracking.
import { test, expect } from '@playwright/test';

test('login Sign in heading matches ui-design.pen typography', async ({ page }) => {
  await page.goto('/login');

  const h1 = page.getByRole('heading', { name: 'Sign in' });
  await expect(h1).toBeVisible();

  const styles = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });

  expect(styles.fontSize).toBe('32px');
  expect(styles.letterSpacing).toBe('-0.8px');
});
