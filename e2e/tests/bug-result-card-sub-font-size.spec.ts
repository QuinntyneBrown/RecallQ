// Covers bug: docs/bugs/result-card-sub-font-size-too-large.md
// Per docs/ui-design.pen SuhQ1, the result-card sub line is 12px.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('result-card sub line is 12px', async ({ page }) => {
  const email = `rcsf-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    role: 'CTO',
    organization: 'Anthropic',
  });
  await api(page).addContact({
    displayName: 'Sarah Bradley',
    initials: 'SB',
    role: 'Designer',
    organization: 'Stripe',
  });

  await page.goto('/search?q=Sarah');

  const sub = page.locator('[data-testid="result-card"] .sub').first();
  await expect(sub).toBeVisible({ timeout: 10_000 });

  const fontSize = await sub.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('12px');
});
