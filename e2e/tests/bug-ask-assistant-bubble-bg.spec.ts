// Covers bug: docs/bugs/ask-assistant-bubble-bg-too-light.md
// Per docs/ui-design.pen 6rsdj (ansBubble), AI answer bubbles paint
// $surface-secondary (#141425), not the lighter $surface-elevated.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('assistant bubble background is --surface-secondary', async ({ page }) => {
  const email = `aab-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  // The greet bubble renders as an assistant-bubble even before any
  // request, so we don't need to mock /api/ask.
  const bubble = page.getByTestId('greet-bubble');
  await expect(bubble).toBeVisible({ timeout: 10_000 });

  const bg = await bubble.evaluate((el) => getComputedStyle(el).backgroundColor);
  // --surface-secondary = #141425 -> rgb(20, 20, 37)
  expect(bg).toBe('rgb(20, 20, 37)');
});
