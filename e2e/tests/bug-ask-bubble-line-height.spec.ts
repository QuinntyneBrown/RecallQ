// Covers bug: docs/bugs/ask-bubble-line-height-too-tight.md
// Per docs/ui-design.pen qpWU7 (assistant body text inside 6rsdj),
// chat bubbles render at lineHeight 1.5. Implementation paints 1.4.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask chat bubbles render at line-height 1.5', async ({ page }) => {
  const email = `ablh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const bubble = page.getByTestId('greet-bubble');
  await expect(bubble).toBeVisible({ timeout: 10_000 });

  // Computed line-height returns px when set as a unitless multiplier.
  // 13px * 1.5 = 19.5px (Chromium rounds to 19.5 or 20). Compute the
  // ratio against the actual font-size to keep the assertion exact.
  const ratio = await bubble.evaluate((el) => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
  });
  expect(ratio).toBeCloseTo(1.5, 2);
});
