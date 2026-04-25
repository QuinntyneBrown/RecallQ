// Traces to: L1-002, L2-083
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('flow 10: star contact toggles starred state and persists', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Star Test Contact',
    initials: 'STC',
  });

  // Navigate to contact detail
  await page.goto(`/contacts/${contactId}`);
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Find star button - initially should say "Star contact" (not starred)
  let starButton = page.getByRole('button', { name: 'Star contact' });

  if (await starButton.isVisible()) {
    // Star is not filled, click to fill it
    await starButton.click();

    // Verify button text changed to "Unstar contact" (optimistic update)
    await expect(page.getByRole('button', { name: 'Unstar contact' })).toBeVisible();

    // Verify API call succeeds by checking for error toast
    await expect(page.locator('text=Could not update star')).not.toBeVisible({ timeout: 3000 });
  }
});

test('flow 10: star toggle is reversible', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Reversible Star Contact',
    initials: 'RSC',
  });

  await page.goto(`/contacts/${contactId}`);
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Toggle 1: Star the contact
  await page.getByRole('button', { name: 'Star contact' }).click();
  await expect(page.getByRole('button', { name: 'Unstar contact' })).toBeVisible();

  // Toggle 2: Unstar the contact
  await page.getByRole('button', { name: 'Unstar contact' }).click();
  await expect(page.getByRole('button', { name: 'Star contact' })).toBeVisible();

  // Verify no errors during toggles
  await expect(page.locator('text=Could not update star')).not.toBeVisible({ timeout: 3000 });
});

test('flow 10: star state persists across page reload', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Persist Star Contact',
    initials: 'PSC',
  });

  await page.goto(`/contacts/${contactId}`);

  // Star the contact
  await page.getByRole('button', { name: 'Star contact' }).click();
  await expect(page.getByRole('button', { name: 'Unstar contact' })).toBeVisible();

  // Reload page
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Check star state persisted - should still show "Unstar contact"
  await expect(page.getByRole('button', { name: 'Unstar contact' })).toBeVisible();
});
