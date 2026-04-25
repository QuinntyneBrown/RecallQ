// Covers bug: docs/bugs/result-card-radius-too-large.md
// Per docs/ui-design.pen A4c7W cornerRadius is 18.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('search result card border-radius is 18px', async ({ page }) => {
  const email = `rcrd-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });
  await api(page).addContact({ displayName: 'Bob Carter', initials: 'BC' });

  await page.goto('/search?q=Sarah');

  const card = page.locator('[data-testid="result-card"]').first();
  await expect(card).toBeVisible({ timeout: 10_000 });

  const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe('18px');
});
