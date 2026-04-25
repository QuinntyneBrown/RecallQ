// Covers bug: docs/bugs/contact-detail-log-btn-purple-not-cyan.md
// The "+ Log" button next to the timeline header should paint
// --accent-tertiary cyan, matching the project's interactive accent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail Log button uses cyan, not purple', async ({ page }) => {
  const email = `cdlb-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const log = page.locator('.log-btn');
  await expect(log).toBeVisible();

  const color = await log.evaluate((el) => getComputedStyle(el).color);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
