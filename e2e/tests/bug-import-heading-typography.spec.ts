// Covers bug: docs/bugs/import-heading-typography-mismatch.md
// Per docs/ui-design.pen Eaa6Y, the import heading is Geist 28/700
// with -0.6px tracking.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('import h1 typography matches design', async ({ page }) => {
  const email = `imhd-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/import');

  const h1 = page.getByRole('heading', { name: 'Import Contacts' });
  await expect(h1).toBeVisible();

  const styles = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });

  expect(styles.fontSize).toBe('28px');
  expect(styles.letterSpacing).toBe('-0.6px');
});
