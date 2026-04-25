// Covers bug: docs/bugs/reset-password-input-focus-purple-not-cyan.md
// Reset-password local input:focus-visible should paint
// --accent-tertiary cyan, not --accent-primary purple.
import { test, expect } from '@playwright/test';

test('reset-password input focus border is cyan', async ({ page }) => {
  await page.goto('/reset-password?token=fake');

  const input = page.getByLabel('New password');
  await expect(input).toBeVisible();
  await input.focus();

  const styles = await input.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { borderColor: cs.borderColor, boxShadow: cs.boxShadow };
  });

  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(styles.borderColor).toBe('rgb(75, 232, 255)');
  expect(styles.boxShadow).toContain('rgb(75, 232, 255)');
});
