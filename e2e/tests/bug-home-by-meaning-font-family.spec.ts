// Covers bug: docs/bugs/home-by-meaning-subtitle-wrong-font-family.md
// Per docs/ui-design.pen node KhJIT, the gradient sub line uses Geist.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home `By meaning` sub line uses Geist', async ({ page }) => {
  const email = `hsff-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const sub = page.locator('.hero-sub');
  await expect(sub).toHaveText('By meaning, not memory.');

  const fontFamily = await sub.evaluate((el) => getComputedStyle(el).fontFamily);
  // The sub line should lead with Geist. The headline above it does
  // (via the global h1..h6 rule) — they must match to read as one block.
  expect(fontFamily.toLowerCase()).toContain('geist');
});
