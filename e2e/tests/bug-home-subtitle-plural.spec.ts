// Covers bug: docs/bugs/home-subtitle-wrong-plural-for-single-item.md
// After adding exactly one contact, the home hero subtitle currently
// reads '1 contacts and 0 interactions' — the plural nouns don't
// agree with the '1' count.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('home subtitle uses singular nouns when counts are 1', async ({ page }) => {
  const email = `plural-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await createContact(page, { displayName: 'Solo Contact', initials: 'SC' });

  await page.goto('/home');
  const subtitle = page.getByTestId('hero-subtitle');
  await expect(subtitle).toBeVisible();
  await expect(subtitle).toContainText('1 contact ');
  await expect(subtitle).not.toContainText('1 contacts');
});
