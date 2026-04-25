// Covers bug: docs/bugs/quick-action-tile-active-border-purple-not-cyan.md
// The Message tile becomes active when the contact has at least one
// email; assert its border-color computes to cyan.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('quick-action-tile active border is cyan', async ({ page }) => {
  const email = `qatc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    emails: ['sarah@example.com'],
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const tile = page.locator('.tile.active').first();
  await expect(tile).toBeVisible({ timeout: 5_000 });

  const color = await tile.evaluate((el) => getComputedStyle(el).borderTopColor);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
