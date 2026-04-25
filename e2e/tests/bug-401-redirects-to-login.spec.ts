// Covers bug: docs/bugs/protected-401-does-not-redirect-to-login.md
// A 401 on a non-auth protected endpoint must clear the session and
// send the visitor back to /login, per Flow 04 and Flow 02's
// 'Token or cookie lost' alternative.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('401 on a protected call sends the user to /login', async ({ page }) => {
  const email = `401-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');
  await expect(page).toHaveURL(/\/home$/);

  await page.route('**/api/contacts/count', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );

  await page.reload();

  await expect(page).toHaveURL(/\/login(?:\?returnUrl=%2Fhome)?$/);
});
