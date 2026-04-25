// Covers bug: docs/bugs/home-by-meaning-subtitle-missing-gradient.md
// Per docs/ui-design.pen node KhJIT (frame `1. Vector Search Home`),
// the `By meaning, not memory.` line is filled with a 90deg linear
// gradient from #7C3AFF to #FF5EE7. Implementation must paint the
// brand gradient instead of a flat muted color.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('home `By meaning, not memory.` paints the brand gradient', async ({ page }) => {
  const email = `subg-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/home');

  const sub = page.locator('.hero-sub');
  await expect(sub).toBeVisible();
  await expect(sub).toHaveText('By meaning, not memory.');

  const styles = await sub.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      backgroundImage: cs.backgroundImage,
      webkitTextFillColor: (cs as CSSStyleDeclaration & { webkitTextFillColor?: string })
        .webkitTextFillColor,
      backgroundClip:
        cs.backgroundClip ||
        (cs as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip,
    };
  });

  expect(styles.backgroundImage).toContain('linear-gradient');
  // Gradient stops sourced from ui-design.pen / tokens.css
  // (--accent-gradient-start #7C3AFF and --accent-gradient-end #FF5EE7).
  expect(styles.backgroundImage).toMatch(/124,\s*58,\s*255/);
  expect(styles.backgroundImage).toMatch(/255,\s*94,\s*231/);
  // Clipping the gradient to text yields transparent fill.
  expect(styles.backgroundClip).toContain('text');
  expect(styles.webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');
});
