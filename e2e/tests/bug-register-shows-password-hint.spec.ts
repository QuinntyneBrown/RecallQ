// Covers bug: docs/bugs/register-page-missing-password-requirements-hint.md
// The Register page must show the password requirements upfront so
// visitors can comply on the first attempt.
import { test, expect } from '@playwright/test';

test('register page renders the password requirements hint', async ({ page }) => {
  await page.goto('/register');

  const hint = page.getByTestId('password-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(/12/);
  await expect(hint).toContainText(/letter/i);
  await expect(hint).toContainText(/digit/i);
});
