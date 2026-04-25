// Covers bug: docs/bugs/contact-detail-hero-chip-missing-border.md
// Per docs/ui-design.pen m08RM, hero tag chips have a 1px white-tint
// border. Seed a contact with tags and assert the chip's border is set.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail hero chip has white-tint border', async ({ page }) => {
  const email = `cdhc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    tags: ['Investor', 'AI'],
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const chip = page.locator('.hero .chip').first();
  await expect(chip).toBeVisible({ timeout: 5_000 });

  const styles = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      borderWidth: cs.borderTopWidth,
      borderStyle: cs.borderTopStyle,
      borderColor: cs.borderTopColor,
    };
  });

  expect(styles.borderWidth).toBe('1px');
  expect(styles.borderStyle).toBe('solid');
  // rgba(255,255,255,0.20)
  expect(styles.borderColor).toBe('rgba(255, 255, 255, 0.2)');
});
