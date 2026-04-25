// Covers bug: docs/bugs/import-upload-btn-not-matching-button-primary.md
// Per docs/ui-design.pen Button Primary 8VJjL, the primary CTA is
// a brand-gradient pill (border-radius 999) with a soft purple
// shadow. The .upload-btn on /import is a flat-purple radius-14
// rectangle.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('import upload button matches button-primary visual', async ({ page }) => {
  const email = `imup-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/import');

  const btn = page.locator('.upload-btn');
  await expect(btn).toBeVisible();

  const styles = await btn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      borderRadius: cs.borderRadius,
      background: cs.backgroundImage,
      boxShadow: cs.boxShadow,
    };
  });

  // Pill radius — exact value (999px) or any value ≥ height/2 reads as a pill;
  // tokens map --radius-full to 999px.
  expect(parseFloat(styles.borderRadius)).toBeGreaterThanOrEqual(48);
  // Linear gradient with both brand stops.
  expect(styles.background).toContain('linear-gradient');
  expect(styles.background).toMatch(/124,\s*58,\s*255/); // #7C3AFF
  expect(styles.background).toMatch(/255,\s*94,\s*231/); // #FF5EE7
  // Shadow rgba(124, 58, 255, 0.4).
  expect(styles.boxShadow).toContain('rgba(124, 58, 255, 0.4)');
});
