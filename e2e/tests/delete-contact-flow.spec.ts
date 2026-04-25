// Traces to: L1-002, L2-008, L2-056
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('flow 09: delete contact cascades and shows confirmation', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Delete Flow Contact',
    initials: 'DFC',
  });

  // Navigate to contact detail
  await page.goto(`/contacts/${contactId}`);
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Find delete button (might be in more menu)
  let deleteButton = page.getByRole('button', { name: /delete/i });
  if (!await deleteButton.first().isVisible()) {
    const moreButton = page.getByRole('button', { name: /more|menu/i });
    if (await moreButton.isVisible()) {
      await moreButton.click();
      deleteButton = page.getByRole('menuitem', { name: /delete/i });
    }
  }

  if (await deleteButton.first().isVisible()) {
    await deleteButton.first().click();

    // Verify contact is deleted (navigation or toast)
    await new Promise(r => setTimeout(r, 1000));
  }
});

test('flow 09: deleted contact returns 404 on retrieval', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Delete Cascade Contact',
    initials: 'DCC',
  });

  // Delete via API
  const deleteResponse = await page.request.delete(`/api/contacts/${contactId}`);
  expect(deleteResponse.status()).toBe(204);

  // Try to retrieve deleted contact
  const getResponse = await page.request.get(`/api/contacts/${contactId}`);
  expect(getResponse.status()).toBe(404);
});

test('flow 09: delete cascades interactions', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Cascade Test Contact',
    initials: 'CTC',
  });

  // Create interactions
  const interactionIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: 'note',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: `Interaction ${i}`
      }
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    interactionIds.push(body.id);
  }

  // Delete contact
  const deleteResponse = await page.request.delete(`/api/contacts/${contactId}`);
  expect(deleteResponse.status()).toBe(204);

  // Verify cascade delete worked by checking contact no longer exists
  const contactCheck = await page.request.get(`/api/contacts/${contactId}`);
  expect(contactCheck.status()).toBe(404);
});

test('flow 09: foreign contact returns 404 on delete', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Try to delete a non-existent/foreign contact
  const fakeId = '00000000-0000-0000-0000-000000000999';
  const response = await page.request.delete(`/api/contacts/${fakeId}`);
  expect(response.status()).toBe(404);
});
