// Covers bug: docs/bugs/sort-menu-chip-font-size-too-large.md
// Per docs/ui-design.pen 0Evpx, the sort button label is Inter 11/500.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('sort-menu chip is 11px / 500 weight', async ({ page }) => {
  const email = `smcr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Seed a contact so the search results page mounts the sort-menu.
  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });

  await page.goto('/search?q=Sarah');

  const chip = page.locator('app-sort-menu .chip');
  await expect(chip).toBeVisible({ timeout: 10_000 });

  const styles = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, fontWeight: cs.fontWeight };
  });

  expect(styles.fontSize).toBe('11px');
  expect(styles.fontWeight).toBe('500');
});
