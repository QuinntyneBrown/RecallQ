// Covers bug: docs/bugs/score-chip-dimensions-too-large.md
// Per docs/ui-design.pen 0QZrm, the score chips are 24 tall with
// Geist Mono 11/600.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('score-chip is 24px tall with 11px font', async ({ page }) => {
  const email = `scdm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });

  await page.goto('/search?q=Sarah');

  const chip = page.locator('app-score-chip .chip').first();
  await expect(chip).toBeVisible({ timeout: 10_000 });

  const styles = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { height: cs.height, fontSize: cs.fontSize };
  });

  expect(styles.height).toBe('24px');
  expect(styles.fontSize).toBe('11px');
});
