// Covers bug: docs/bugs/button-primary-gradient-does-not-match-ui-design-pen.md
// Node 8VJjL in docs/ui-design.pen defines a 90deg two-stop gradient
// (#7C3AFF → #FF5EE7). The implementation currently renders a vertical
// three-stop gradient with an off-spec #BF40FF mid-stop borrowed from the
// AI suggestion card.
import { test, expect } from '@playwright/test';

test('button-primary gradient is horizontal 90deg two-stop per ui-design.pen', async ({ page }) => {
  await page.goto('/register');
  const button = page.getByRole('button', { name: 'Create account' });
  await expect(button).toBeVisible();

  const bg = await button.evaluate((el) => getComputedStyle(el).backgroundImage);

  expect(bg).toMatch(/^linear-gradient\(90deg,/);
  expect(bg).toContain('rgb(124, 58, 255)');
  expect(bg).toContain('rgb(255, 94, 231)');
  expect(bg).not.toContain('rgb(191, 64, 255)');
});
