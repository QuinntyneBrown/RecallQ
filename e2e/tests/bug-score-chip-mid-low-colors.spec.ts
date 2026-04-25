// Covers bug: docs/bugs/score-chip-mid-low-colors-mismatch.md
// Score tiers are hard to control end-to-end (depend on similarity
// values from the embedding model). Inspect the stylesheet directly:
// .chip.mid should declare --accent-tertiary, .chip.low should
// declare --accent-secondary.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('score-chip .mid + .low rules use design tokens', async ({ page }) => {
  const email = `scml-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Seed a contact so /search renders a result-card (which mounts
  // app-score-chip and loads its CSS chunk).
  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });

  await page.goto('/search?q=Sarah');
  await expect(page.locator('app-score-chip').first()).toBeVisible({ timeout: 10_000 });

  const decls = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof CSSStyleRule)) continue;
        if (rule.selectorText.includes('.chip.mid')) out.mid = rule.style.cssText;
        if (rule.selectorText.includes('.chip.low')) out.low = rule.style.cssText;
      }
    }
    return out;
  });

  expect(decls.mid).toBeDefined();
  expect(decls.mid).toContain('--accent-tertiary');
  expect(decls.mid).not.toContain('--accent-secondary');

  expect(decls.low).toBeDefined();
  expect(decls.low).toContain('--accent-secondary');
  expect(decls.low).not.toContain('--foreground-muted');
});
