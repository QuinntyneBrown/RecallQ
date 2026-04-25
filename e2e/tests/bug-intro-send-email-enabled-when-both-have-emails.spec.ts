// Covers bug: docs/bugs/intro-modal-send-via-email-always-disabled.md
// Per Flow 30, when both parties have emails on file, Send via email
// must be ENABLED so the user can launch their mail client with both
// recipients pre-populated. The current implementation always
// disables the button because the picked second party comes from
// /api/contacts (ContactListDto) which omits the emails field.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('Send via email is enabled when both parties have emails', async ({ page }) => {
  const email = `intro-both-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const idA = await createContact(page, {
    displayName: 'Alice Anchor',
    initials: 'AA',
    emails: ['alice@example.com'],
  });
  await createContact(page, {
    displayName: 'Bob WithMail',
    initials: 'BM',
    emails: ['bob@example.com'],
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
  await page.getByRole('option', { name: 'Bob WithMail' }).click();
  await page.getByRole('button', { name: 'Generate draft' }).click();

  const sendBtn = page.getByRole('button', { name: 'Send via email' });
  await expect(sendBtn).toBeVisible();
  await expect(sendBtn).toBeEnabled();
});
