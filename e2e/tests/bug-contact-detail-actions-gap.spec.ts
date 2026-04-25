// Covers bug: docs/bugs/contact-detail-actions-gap-too-tight.md
// Per docs/ui-design.pen eED35 the action row gap is 10.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail .actions gap is 10px', async ({ page }) => {
  const email = `cdag-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const actions = page.locator('.actions').first();
  await expect(actions).toBeVisible();

  const gap = await actions.evaluate((el) => getComputedStyle(el).gap);
  expect(gap).toBe('10px');
});
