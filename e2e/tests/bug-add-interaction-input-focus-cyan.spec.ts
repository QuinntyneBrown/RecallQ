// Covers bug: docs/bugs/add-edit-interaction-input-focus-purple.md
// Add-interaction's page-local .field inputs should paint
// --accent-tertiary cyan on focus, not --accent-primary purple.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('add-interaction input focus border is cyan', async ({ page }) => {
  const email = `aifc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}/interactions/new`);

  const input = page.locator('.field input').first();
  await expect(input).toBeVisible();
  await input.focus();

  const styles = await input.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { borderColor: cs.borderColor, boxShadow: cs.boxShadow };
  });

  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(styles.borderColor).toBe('rgb(75, 232, 255)');
  expect(styles.boxShadow).toContain('rgb(75, 232, 255)');
});
