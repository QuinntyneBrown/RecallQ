// Covers bug: docs/bugs/skip-to-main-content-link-missing.md
// Flow 40 alternatives require a Skip-to-main-content link at the
// top of the page so keyboard users can bypass the chrome.
import { test, expect } from '@playwright/test';

test('skip link is the first focusable element and targets main', async ({ page }) => {
  await page.goto('/login');

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  await page.keyboard.press('Tab');

  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLAnchorElement | null;
    return el
      ? { tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim(), href: el.getAttribute('href') }
      : null;
  });

  expect(focused?.tag).toBe('a');
  expect(focused?.text.toLowerCase()).toContain('skip');
  expect(focused?.href).toBe('#main');

  // The target should exist and be focusable.
  const main = page.locator('#main');
  await expect(main).toBeAttached();
});
