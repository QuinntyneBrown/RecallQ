// Covers bug: docs/bugs/ask-bubble-border-radius-too-large.md
// Per docs/ui-design.pen MeWfk and 6rsdj, ask chat bubbles round to 18px.
// Implementation paints var(--radius-lg) which is 20px.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask chat bubbles round to 18px', async ({ page }) => {
  const email = `abr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const greet = page.getByTestId('greet-bubble');
  await expect(greet).toBeVisible({ timeout: 10_000 });

  const radius = await greet.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(radius).toBe('18px');
});
