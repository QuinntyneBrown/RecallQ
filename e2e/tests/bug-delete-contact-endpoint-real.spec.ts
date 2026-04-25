// Covers bug: docs/bugs/delete-contact-endpoint-not-implemented.md
// Flow 09 — DELETE /api/contacts/{id} must actually exist on the
// backend. The pre-existing bug-delete-contact spec mocks the DELETE
// response, so it stayed green even though the endpoint is unimplemented.
// This test hits the real backend and verifies the cascade.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('DELETE /api/contacts/{id} actually removes the contact (real backend)', async ({ page }) => {
  const email = `dce-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contactId = await createContact(page, {
    displayName: 'Doomed Contact',
    initials: 'DC',
  });

  // Add an interaction so the cascade actually has work to do.
  const createInteraction = await page.request.post(`/api/contacts/${contactId}/interactions`, {
    data: {
      type: 'note',
      occurredAt: new Date().toISOString(),
      subject: 'Will be cascaded',
      content: 'Body that should also be deleted.',
    },
  });
  expect(createInteraction.status()).toBe(201);

  // Sanity — the contact is fetchable.
  const before = await page.request.get(`/api/contacts/${contactId}`);
  expect(before.status()).toBe(200);

  // Bug: backend has no MapDelete, so this returns 404.
  const del = await page.request.delete(`/api/contacts/${contactId}`);
  expect(del.status(), `expected 204 but got ${del.status()}`).toBe(204);

  // After delete the contact must be gone.
  const after = await page.request.get(`/api/contacts/${contactId}`);
  expect(after.status()).toBe(404);
});
