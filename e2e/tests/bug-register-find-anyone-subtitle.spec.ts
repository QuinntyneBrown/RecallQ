// Covers bug: docs/bugs/register-page-missing-find-anyone-subtitle.md
// Per docs/ui-design.pen hero frame 6sIXe, the register headline is
// paired with a 15px Inter sub line "Find anyone by meaning, not
// memory." at gap 8.
import { test, expect } from '@playwright/test';

test('register page renders the Find anyone subtitle', async ({ page }) => {
  await page.goto('/register');

  const sub = page.locator('.hero-sub', {
    hasText: 'Find anyone by meaning, not memory.',
  });
  await expect(sub).toBeVisible();

  const styles = await sub.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, color: cs.color };
  });

  expect(styles.fontSize).toBe('15px');
  // var(--foreground-secondary) = #B8B8D4 -> rgb(184, 184, 212)
  expect(styles.color).toBe('rgb(184, 184, 212)');
});
