// Covers bug: docs/bugs/register-page-has-no-product-branding-or-logo.md
// /register and /login drop the visitor onto a bare form. Every other
// screen in docs/ui-design.pen begins with the RecallQ logo + product
// name at the top. Without it, a visitor landing here from an external
// link has no cue they are on RecallQ.
import { test, expect } from '@playwright/test';

for (const route of ['/register', '/login']) {
  test(`${route} shows RecallQ brand`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByTestId('brand')).toBeVisible();
    await expect(page.getByTestId('brand')).toContainText('RecallQ');
  });
}
