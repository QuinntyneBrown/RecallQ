// Covers bug: docs/bugs/bottom-nav-is-visible-on-unauthenticated-pages.md
// The bottom nav (and home indicator) must not appear on unauthenticated
// surfaces — tapping a nav tab bounces the visitor to /login, which reads
// as broken UX.
import { test, expect } from '@playwright/test';

for (const route of ['/register', '/login']) {
  test(`bottom nav is hidden on ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    await expect(page.getByTestId('home-indicator')).toBeHidden();
  });
}
