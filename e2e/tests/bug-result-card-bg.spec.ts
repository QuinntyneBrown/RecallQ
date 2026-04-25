// Covers bug: docs/bugs/result-card-background-mismatch.md
// Per docs/ui-design.pen A4c7W/pwLgb, the result card fills with
// --surface-secondary (#141425, rgb(20,20,37)).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('result card uses --surface-secondary background', async ({ page }) => {
  const email = `rcbg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  await api(page).addContact({
    displayName: 'Bob Carter',
    initials: 'BC',
  });

  await page.goto('/search?q=Sarah');

  const card = page.locator('.card').first();
  await expect(card).toBeVisible({ timeout: 10_000 });

  const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
  // --surface-secondary = #141425 -> rgb(20, 20, 37)
  expect(bg).toBe('rgb(20, 20, 37)');
});
