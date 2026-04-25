// Covers bug: docs/bugs/ask-bubble-font-size-too-large.md
// Per docs/ui-design.pen 1V5hQ and qpWU7, ask chat bubbles render Inter
// 13px. Implementation inherits 16px from the body.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask chat bubbles render at 13px', async ({ page }) => {
  const email = `abf-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const bubble = page.getByTestId('greet-bubble');
  await expect(bubble).toBeVisible({ timeout: 10_000 });

  const size = await bubble.evaluate((el) => getComputedStyle(el).fontSize);
  expect(size).toBe('13px');
});
