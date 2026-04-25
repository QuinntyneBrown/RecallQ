// Covers bug: docs/bugs/add-edit-interaction-pill-icons-all-purple.md
// Per docs/ui-design.pen interaction pills, each type paints its own
// hue (email cyan, call green, meeting purple, note orange).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('add-interaction pill icons colour-code by type', async ({ page }) => {
  const email = `aipi-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}/interactions/new`);

  const emailIcon = await page.locator('.pill.pill-email i').evaluate(
    (el) => getComputedStyle(el).color,
  );
  const callIcon = await page.locator('.pill.pill-call i').evaluate(
    (el) => getComputedStyle(el).color,
  );
  const meetingIcon = await page.locator('.pill.pill-meeting i').evaluate(
    (el) => getComputedStyle(el).color,
  );
  const noteIcon = await page.locator('.pill.pill-note i').evaluate(
    (el) => getComputedStyle(el).color,
  );

  expect(emailIcon).toBe('rgb(75, 232, 255)');   // --accent-tertiary
  expect(callIcon).toBe('rgb(61, 255, 179)');    // --success
  expect(meetingIcon).toBe('rgb(191, 64, 255)'); // --accent-secondary
  expect(noteIcon).toBe('rgb(255, 178, 61)');    // --star-fill
});
