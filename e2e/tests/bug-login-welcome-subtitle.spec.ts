// Covers bug: docs/bugs/login-page-missing-welcome-subtitle.md
// Per docs/ui-design.pen hero frame qoVhd, the login headline is
// paired with a 15px Inter sub line "Welcome back." at gap 8.
import { test, expect } from '@playwright/test';

test('login page renders the Welcome back. subtitle', async ({ page }) => {
  await page.goto('/login');

  const sub = page.locator('.hero-sub', { hasText: 'Welcome back.' });
  await expect(sub).toBeVisible();

  const styles = await sub.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, color: cs.color };
  });

  expect(styles.fontSize).toBe('15px');
  // var(--foreground-secondary) = #B8B8D4 -> rgb(184, 184, 212)
  expect(styles.color).toBe('rgb(184, 184, 212)');
});
