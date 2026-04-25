// Covers bug: docs/bugs/button-primary-typography-not-matching-design.md
// Per docs/ui-design.pen K01yN, the primary CTA label is Geist 15/600.
import { test, expect } from '@playwright/test';

test('button-primary label uses Geist 15', async ({ page }) => {
  await page.goto('/register');

  const cta = page.getByRole('button', { name: 'Create account' });
  await expect(cta).toBeVisible();

  const styles = await cta.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontFamily: cs.fontFamily, fontSize: cs.fontSize };
  });

  expect(styles.fontFamily.toLowerCase()).toContain('geist');
  expect(styles.fontSize).toBe('15px');
});
