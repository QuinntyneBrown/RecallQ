// Covers bug: docs/bugs/login-remember-and-forgot-not-on-same-row.md
// Per docs/ui-design.pen mJfJ2, the Remember me checkbox and Forgot
// password? link share a single space_between row.
import { test, expect } from '@playwright/test';

test('login Remember me and Forgot password? share a row', async ({ page }) => {
  await page.goto('/login');

  const remember = page.getByRole('checkbox', { name: 'Remember me' });
  const forgot = page.getByRole('link', { name: 'Forgot password?' });
  await expect(remember).toBeVisible();
  await expect(forgot).toBeVisible();

  // Both element rects should overlap vertically — the difference between
  // their y-centers should be small (single row).
  const yDelta = await page.evaluate(() => {
    const r = (document.querySelector('[role="checkbox"][aria-checked]') as HTMLElement)?.getBoundingClientRect();
    const f = Array.from(document.querySelectorAll('a')).find((el) => el.textContent?.trim() === 'Forgot password?')?.getBoundingClientRect();
    if (!r || !f) return Number.NaN;
    return Math.abs((r.top + r.height / 2) - (f.top + f.height / 2));
  });

  // ±6px tolerance for line-box differences between an icon-button row
  // and a text link rendered next to each other.
  expect(yDelta).toBeLessThanOrEqual(6);
});
