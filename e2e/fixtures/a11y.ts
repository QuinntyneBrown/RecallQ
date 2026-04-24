// Task: T031 — axe fixture for WCAG 2.2 AA scans.
import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export async function runAxe(page: Page, selector?: string) {
  const builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
  if (selector) builder.include(selector);
  return await builder.analyze();
}

export function seriousOrCritical(violations: { impact?: string | null }[]) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}
