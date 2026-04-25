// Covers bug: docs/bugs/home-smart-stacks-heading-uppercase.md
// Per node 0OyoH in docs/ui-design.pen the heading is the
// mixed-case 'Smart stacks', not 'SMART STACKS'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home Smart Stacks heading uses mixed case per design', async ({ page }) => {
  const email = `stkh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Mock at least one stack so the section renders.
  await page.route('**/api/stacks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'a', name: 'AI founders', kind: 'Tag', count: 5 }]),
    }),
  );

  await page.goto('/home');

  const heading = page.getByRole('heading', { name: /smart stacks/i });
  await expect(heading).toBeVisible();
  await expect(heading).toContainText('Smart stacks');
  await expect(heading).not.toContainText('SMART STACKS');
});
