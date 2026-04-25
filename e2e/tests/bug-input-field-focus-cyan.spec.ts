// Covers bug: docs/bugs/input-field-focus-mixes-purple-with-global-cyan.md
// The input-field component should focus with --accent-tertiary cyan,
// matching the global :focus-visible rule rather than fighting it
// with --accent-primary purple.
import { test, expect } from '@playwright/test';

test('input-field focus border + ring use cyan, not purple', async ({ page }) => {
  await page.goto('/register');

  const email = page.getByRole('textbox', { name: 'Email' });
  await expect(email).toBeVisible();
  await email.focus();

  const styles = await email.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { borderColor: cs.borderColor, boxShadow: cs.boxShadow };
  });

  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(styles.borderColor).toBe('rgb(75, 232, 255)');
  expect(styles.boxShadow).toContain('rgb(75, 232, 255)');
});
