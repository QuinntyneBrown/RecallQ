// Covers bug: docs/bugs/ask-input-focus-purple-not-cyan.md
// Mirrors the input-field and home-search focus fixes: the ask page
// .input-bar input:focus-visible should paint --accent-tertiary cyan,
// not --accent-primary purple.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask input focus border is cyan', async ({ page }) => {
  const email = `aifc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const input = page.locator('[data-testid="input-bar"] input');
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
