// Covers bug: docs/bugs/stack-card-aria-label-omits-count.md
// Stack-card aria-label must include the count so screen-reader
// users hear "27 AI founders" instead of just "AI founders".
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('stack-card aria-label includes count and name', async ({ page }) => {
  const email = `sca-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/stacks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a', name: 'AI founders', kind: 'Tag', count: 27 },
        { id: 'b', name: 'Close friends', kind: 'Tag', count: 9 },
      ]),
    }),
  );

  await page.goto('/home');

  await expect(page.getByRole('link', { name: '27 AI founders' })).toBeVisible();
  await expect(page.getByRole('link', { name: '9 Close friends' })).toBeVisible();
});

test('stack-card with saturated count uses 999+ in aria-label', async ({ page }) => {
  const email = `scb-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/stacks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a', name: 'Everyone', kind: 'Tag', count: 5000 },
      ]),
    }),
  );

  await page.goto('/home');

  await expect(page.getByRole('link', { name: '999+ Everyone' })).toBeVisible();
});
