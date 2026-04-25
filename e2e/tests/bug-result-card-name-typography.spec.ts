// Covers bug: docs/bugs/result-card-name-typography-mismatch.md
// Per docs/ui-design.pen bkdN0, the result-card name is Geist 15/600.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('result-card name uses Geist 15', async ({ page }) => {
  const email = `rcnt-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Two contacts so the second one is rendered as a regular result card
  // (not the featured result, which has its own typography).
  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });
  await api(page).addContact({ displayName: 'Sarah Bradley', initials: 'SB' });

  await page.goto('/search?q=Sarah');

  const name = page.locator('[data-testid="result-card"] .name').first();
  await expect(name).toBeVisible({ timeout: 10_000 });

  const styles = await name.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontFamily: cs.fontFamily, fontSize: cs.fontSize };
  });

  expect(styles.fontFamily.toLowerCase()).toContain('geist');
  expect(styles.fontSize).toBe('15px');
});
