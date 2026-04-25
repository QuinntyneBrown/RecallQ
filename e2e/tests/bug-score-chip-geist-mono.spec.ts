// Covers bug: docs/bugs/score-chip-font-family-not-geist-mono.md
// Per docs/ui-design.pen lSR2w, the score chip value is Geist Mono.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('score-chip value uses Geist Mono', async ({ page }) => {
  const email = `scgm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });

  await page.goto('/search?q=Sarah');

  const chip = page.locator('app-score-chip .chip').first();
  await expect(chip).toBeVisible({ timeout: 10_000 });

  const fontFamily = await chip.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toContain('geist mono');
});
