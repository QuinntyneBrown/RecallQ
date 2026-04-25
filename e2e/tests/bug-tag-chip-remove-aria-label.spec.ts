// Covers bug: docs/bugs/add-contact-tag-chip-remove-aria-label-not-unique.md
// Each tag chip's remove button must carry a unique aria-label
// that includes the tag value.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('tag chip remove buttons announce the tag value', async ({ page }) => {
  const email = `taglbl-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/contacts/new');

  const tagInput = page.getByLabel('Tags');
  await tagInput.fill('investor');
  await tagInput.press('Enter');
  await tagInput.fill('friend');
  await tagInput.press('Enter');

  await expect(page.getByRole('button', { name: 'Remove tag investor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove tag friend' })).toBeVisible();
});
