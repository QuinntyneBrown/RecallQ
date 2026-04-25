// Covers bug: docs/bugs/home-greeting-typography-mismatch.md
// Per docs/ui-design.pen node U0SNr the home greeting is Inter 13/500.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home greeting typography matches ui-design.pen', async ({ page }) => {
  const email = `gtyp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const greeting = page.locator('.greeting');
  await expect(greeting).toBeVisible();

  const styles = await greeting.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, fontWeight: cs.fontWeight };
  });

  expect(styles.fontSize).toBe('13px');
  expect(styles.fontWeight).toBe('500');
});
