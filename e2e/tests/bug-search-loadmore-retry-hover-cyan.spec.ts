// Covers bug: docs/bugs/search-loadmore-retry-hover-purple.md
// The .loadmore-retry button only renders when search pagination
// errors out — too brittle to trigger end-to-end. Instead, inspect
// the CSS rule directly via document.styleSheets to assert the hover
// state uses --accent-tertiary.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('search .loadmore-retry hover rule uses --accent-tertiary', async ({ page }) => {
  const email = `slmr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');
  // Navigate to /search so Angular loads the page-scoped stylesheet.
  await page.goto('/search?q=hello');
  // Wait for the page wrapper so the lazy-loaded chunk is parsed.
  await expect(page.locator('section.page')).toBeVisible({ timeout: 10_000 });

  const declarations = await page.evaluate(() => {
    const out: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule &&
            rule.selectorText.includes('loadmore-retry') &&
            rule.selectorText.includes('hover')) {
          out.push(rule.style.cssText);
        }
      }
    }
    return out;
  });

  expect(declarations.length).toBeGreaterThan(0);
  for (const decl of declarations) {
    expect(decl).toContain('--accent-tertiary');
    expect(decl).not.toContain('--accent-primary');
  }
});
