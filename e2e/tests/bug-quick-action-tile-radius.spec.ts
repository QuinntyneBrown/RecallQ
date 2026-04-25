// Covers bug: docs/bugs/quick-action-tile-radius-too-large.md
// Per docs/ui-design.pen NQkMx, the action-row tiles round at 16.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('quick-action-tile border-radius is 16px', async ({ page }) => {
  const email = `qatr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const tile = page.locator('.tile').first();
  await expect(tile).toBeVisible();

  const radius = await tile.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe('16px');
});
