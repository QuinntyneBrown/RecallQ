// Covers bug: docs/bugs/contact-detail-hero-min-height-too-short.md
// Per docs/ui-design.pen cNcxs the hero gradient backdrop is 320 tall.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail hero min-height is 320px', async ({ page }) => {
  const email = `cdhh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const hero = page.locator('.hero').first();
  await expect(hero).toBeVisible();

  const minHeight = await hero.evaluate((el) => getComputedStyle(el).minHeight);
  expect(minHeight).toBe('320px');
});
