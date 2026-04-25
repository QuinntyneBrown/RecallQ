// Covers bug: docs/bugs/login-forgot-password-link-routes-nowhere.md
// Flow 42 — the login page must not advertise a recovery link that
// silently redirects back to /login. Until the reset-password feature
// (PD001 / flow 43) is implemented, the link is gone.
import { test, expect } from '@playwright/test';

test('login page does not render a dead Forgot password link', async ({ page }) => {
  await page.goto('/login');

  // The Remember me row must still be visible — the bug is specifically
  // about the missing recovery feature, not the login form layout.
  await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible();

  // The link is dead: clicking it routes through the wildcard back to
  // /login. Until the recovery feature exists, do not show it.
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCount(0);
});
