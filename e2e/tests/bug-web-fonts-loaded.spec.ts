// Covers bug: docs/bugs/geist-and-inter-web-fonts-are-not-loaded.md
// frontend/src/index.html loads no web fonts — every screen falls back
// to Segoe UI on Windows, Arial on inputs (see the separate form-controls
// bug). Design fidelity is broken globally until Geist and Inter are
// actually served.
import { test, expect } from '@playwright/test';

test('Geist and Inter are declared as loadable font families', async ({ page }) => {
  await page.goto('/register');
  const families = await page.evaluate(() => {
    const set = new Set<string>();
    document.fonts.forEach((ff) => set.add(ff.family.replace(/['"]/g, '')));
    return Array.from(set);
  });
  expect(families).toContain('Geist');
  expect(families).toContain('Inter');
});

test('h1 uses the Geist font stack on /register', async ({ page }) => {
  await page.goto('/register');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toBeVisible();
  const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily).toContain('Geist');
});
