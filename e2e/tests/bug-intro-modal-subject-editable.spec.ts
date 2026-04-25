// Covers bug: docs/bugs/intro-modal-subject-input-is-readonly.md
// Flow 30 step 9 — the intro modal must show an editable draft. The
// subject input is currently `readonly`; this test types over it and
// asserts the new value sticks (and would flow into the mailto: URL).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('intro modal subject input is editable like the body', async ({ page }) => {
  // Stub the LLM endpoint so the test is hermetic and fast.
  await page.route('**/api/intro-drafts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        subject: 'AI generated subject',
        body: 'AI generated body for the intro.',
      }),
    }),
  );

  const email = `ise-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contactAId = await createContact(page, {
    displayName: 'Party A',
    initials: 'PA',
    emails: ['party.a@example.com'],
  });
  await createContact(page, {
    displayName: 'Party B',
    initials: 'PB',
    emails: ['party.b@example.com'],
  });

  await page.goto(`/contacts/${contactAId}`);
  await expect(page.getByTestId('hero-name')).toHaveText('Party A', { timeout: 15_000 });

  // Open the intro modal.
  await page.getByRole('button', { name: 'Draft intro' }).click();

  // Pick Party B as the second party.
  const search = page.getByLabel('Second party');
  await search.fill('Party B');
  await page.getByRole('option', { name: 'Party B' }).click();
  await expect(page.getByTestId('second-party-picked')).toBeVisible();

  // Generate.
  await page.getByRole('button', { name: 'Generate draft' }).click();

  const subjectInput = page.locator('#draft-subject');
  await expect(subjectInput).toHaveValue('AI generated subject');

  // Bug: the input is `readonly`, so .fill() either no-ops or throws.
  await expect(subjectInput).not.toHaveAttribute('readonly', /.*/);
  await subjectInput.fill('User-edited subject');
  await expect(subjectInput).toHaveValue('User-edited subject');
});
