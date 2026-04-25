// Covers bug: docs/bugs/intro-modal-stale-draft-after-changing-second-party.md
// Changing the second-party query after Generate must collapse
// the draft so visitors can't Copy/Send a stale body.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('intro draft collapses when second-party query changes', async ({ page }) => {
  const email = `intro-stale-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const idA = await createContact(page, {
    displayName: 'Anchor One',
    initials: 'AO',
    emails: ['anchor@example.com'],
  });
  await createContact(page, {
    displayName: 'Bee Two',
    initials: 'BT',
    emails: ['bee@example.com'],
  });

  await page.route('**/api/intro-drafts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ subject: 'Intro: Anchor + Bee', body: 'Specific draft body for B' }),
    }),
  );

  await page.goto(`/contacts/${idA}`);
  await page.getByRole('button', { name: 'Draft intro' }).click();

  await page.getByLabel('Second party').fill('Bee');
  await page.getByRole('option', { name: 'Bee Two' }).click();
  await page.getByRole('button', { name: 'Generate draft' }).click();

  // Draft is visible
  const subjectInput = page.locator('#draft-subject');
  await expect(subjectInput).toBeVisible();
  await expect(subjectInput).toHaveValue('Intro: Anchor + Bee');

  // Now change the query — draft must collapse
  await page.getByLabel('Second party').fill('something else');

  await expect(subjectInput).toHaveCount(0);
});
