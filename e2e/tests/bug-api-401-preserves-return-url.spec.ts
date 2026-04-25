// Covers bug: docs/bugs/api-interceptor-401-loses-current-url.md
// When a backend call 401s mid-session the SPA must redirect to
// /login?returnUrl=<current-url> so the user can resume after
// re-auth.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('401 from a protected API redirects to /login with returnUrl', async ({ page }) => {
  const email = `i01-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Stub a protected API to return 401 — refreshCount fires from
  // /home and is the simplest trigger.
  await page.route('**/api/contacts/count', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/home');

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fhome$/);
});
