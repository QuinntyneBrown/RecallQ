// Covers bug: docs/bugs/summary-card-eyebrow-mismatch.md
// Per Flow 26, the contact-detail summary card eyebrow must
// read 'RELATIONSHIP SUMMARY' rather than the generic 'AI SUMMARY'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('summary card eyebrow reads RELATIONSHIP SUMMARY', async ({ page }) => {
  const email = `eye-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'Eyebrow Target', initials: 'ET' });

  await page.goto(`/contacts/${id}`);
  await expect(page.getByText('RELATIONSHIP SUMMARY')).toBeVisible();
  await expect(page.getByText('AI SUMMARY')).toHaveCount(0);
});
