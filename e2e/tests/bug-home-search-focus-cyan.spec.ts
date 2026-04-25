// Covers bug: docs/bugs/home-search-input-focus-purple-not-cyan.md
// Mirrors the input-field focus fix: the home .search-input:focus rule
// should paint --accent-tertiary cyan, not --accent-primary purple.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home search focus border is cyan', async ({ page }) => {
  const email = `srfc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const input = page.locator('.search-input');
  await expect(input).toBeVisible();
  await input.focus();

  const borderColor = await input.evaluate((el) => getComputedStyle(el).borderColor);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(borderColor).toBe('rgb(75, 232, 255)');
});
