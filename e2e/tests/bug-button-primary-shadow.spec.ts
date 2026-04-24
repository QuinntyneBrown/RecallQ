// Covers bug: docs/bugs/button-primary-shadow-does-not-match-ui-design-pen.md
// Node 8VJjL effect in docs/ui-design.pen defines an outer shadow with
// offset y=8, blur=24, spread=-4, and color #7C3AFF66 (alpha 0.40).
// Current CSS uses y=4, blur=16, spread=0, alpha=0.35 — a softer, tighter
// glow that doesn't match the spec.
import { test, expect } from '@playwright/test';

test('button-primary box-shadow matches ui-design.pen', async ({ page }) => {
  await page.goto('/register');
  const button = page.getByRole('button', { name: 'Create account' });
  await expect(button).toBeVisible();

  const shadow = await button.evaluate((el) => getComputedStyle(el).boxShadow);

  // Computed serialization: "rgba(124, 58, 255, 0.4) 0px 8px 24px -4px"
  expect(shadow).toContain('rgba(124, 58, 255, 0.4)');
  expect(shadow).toContain('8px');
  expect(shadow).toContain('24px');
  expect(shadow).toContain('-4px');
});
