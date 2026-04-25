// Covers bug: docs/bugs/ask-top-bar-heading-weight-too-light.md
// Per docs/ui-design.pen 92m8X (inside heBBi topARow), the "Ask RecallQ"
// heading is Geist 17/700. Implementation paints 600.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask top-bar heading renders at 700 weight', async ({ page }) => {
  const email = `atb-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const heading = page.locator('.top-bar h1');
  await expect(heading).toBeVisible({ timeout: 10_000 });

  const weight = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(weight).toBe('700');
});
