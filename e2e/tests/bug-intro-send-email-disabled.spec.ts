// Covers bug: docs/bugs/intro-send-email-not-disabled-when-no-email.md
// Per Flow 30 alternative, 'Send via email' must be disabled when
// either party has no email on file.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('Send via email is disabled when the second party has no email', async ({ page }) => {
  const email = `intro-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const idA = await createContact(page, {
    displayName: 'Alice Anchor',
    initials: 'AA',
    emails: ['alice@example.com'],
  });
  await createContact(page, {
    displayName: 'Bob NoMail',
    initials: 'BN',
  });

  await page.route('**/api/intro-drafts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ subject: 'Intro: Alice + Bob', body: 'Hey both, ...' }),
    }),
  );

  await page.goto(`/contacts/${idA}`);
  await page.getByRole('button', { name: 'Draft intro' }).click();

  await page.getByLabel('Second party').fill('Bob');
  await page.getByRole('option', { name: 'Bob NoMail' }).click();
  await page.getByRole('button', { name: 'Generate draft' }).click();

  const sendBtn = page.getByRole('button', { name: 'Send via email' });
  await expect(sendBtn).toBeVisible();
  await expect(sendBtn).toBeDisabled();
});
