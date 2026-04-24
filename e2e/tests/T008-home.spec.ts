// Traces to: L2-009, L2-081
// Task: T008
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { HomePage } from '../pages/home.page';
import { screenshot } from '../fixtures/screenshot';

test('home shows live contact count after seeding 3 contacts', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  await createContact(page, { displayName: 'Alpha 1', initials: 'A1' });
  await createContact(page, { displayName: 'Alpha 2', initials: 'A2' });
  await createContact(page, { displayName: 'Alpha 3', initials: 'A3' });

  const home = new HomePage(page);
  await home.goto();
  await expect(home.subtitle()).toContainText('3 contacts and 0 interactions.');
  await expect(home.title()).toBeVisible();
  await expect(home.searchInput()).toBeVisible();

  await screenshot(page, 'T008-home');
});
