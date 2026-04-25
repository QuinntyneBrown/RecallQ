// Covers bug: docs/bugs/zero-state-missing-edit-query-action.md
// Flow 18 step 3 requires the zero-state to expose an 'Edit query'
// ghost action that returns the visitor to a place where they can
// rewrite the query.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('zero-state Edit query routes back to /home', async ({ page }) => {
  const email = `eq-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const q = 'nobody-here-' + Date.now();
  await page.goto(`/search?q=${encodeURIComponent(q)}`);

  const zero = page.getByTestId('zero-state');
  await expect(zero).toBeVisible();

  const editBtn = zero.getByRole('button', { name: /edit query/i });
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  await expect(page).toHaveURL(/\/home$/);
});
