// Covers bug: docs/bugs/edit-interaction-can-only-edit-recent-3.md
// Flow 13 — the Edit Interaction page must hydrate the form for any
// interaction the user owns, not just the 3 most recent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('edit page loads an interaction beyond the most recent 3', async ({ page }) => {
  const email = `eit-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contactId = await createContact(page, {
    displayName: 'Many Interactions',
    initials: 'MI',
  });

  // Create 4 interactions via API. Stagger occurredAt so one is clearly
  // the oldest (and therefore not in the contact-detail "recent 3").
  const baseDate = new Date('2026-01-15T12:00:00Z').getTime();
  const subjects = ['Oldest call', 'Second call', 'Third call', 'Most recent call'];
  const ids: string[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const occurredAt = new Date(baseDate + i * 60 * 60_000).toISOString();
    const res = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: 'call',
        occurredAt,
        subject: subjects[i],
        content: `Body for ${subjects[i]}`,
      },
    });
    expect(res.status(), `failed to create interaction ${i}`).toBe(201);
    const body = await res.json();
    ids.push(body.id);
  }

  // ids[0] is the OLDEST interaction. The contact-detail GET only
  // returns the 3 most recent, so the edit page must not rely on that
  // payload to hydrate.
  const oldestId = ids[0];
  await page.goto(`/contacts/${contactId}/interactions/${oldestId}/edit`);

  await expect(page.getByRole('heading', { name: 'Edit Interaction' })).toBeVisible({ timeout: 15_000 });

  // Bug: the page sets error "We couldn't find that interaction." and
  // never renders the form fields.
  await expect(page.getByRole('alert')).toHaveCount(0);

  // Form must be populated with the oldest interaction's data.
  await expect(page.getByLabel('Subject')).toHaveValue('Oldest call');
  await expect(page.getByLabel('Content')).toHaveValue('Body for Oldest call');
});
