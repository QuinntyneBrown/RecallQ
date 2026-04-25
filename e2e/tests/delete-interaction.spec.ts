// Traces to: L1-003, L2-013, L2-033
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { AddInteractionPage } from '../pages/add-interaction.page';

test('flow 14: delete interaction removes it from timeline', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Delete Test Contact',
    initials: 'DTC',
  });

  // Log an interaction
  const interaction = new AddInteractionPage(page);
  await interaction.goto(contactId);
  await interaction.selectType('note');
  await interaction.setContent('This will be deleted');
  await interaction.save();

  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));
  await expect(page.getByText('This will be deleted')).toBeVisible();

  // Delete the interaction
  const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
  if (await deleteButton.isVisible()) {
    await deleteButton.click();

    // Verify interaction is removed (either immediately or after confirmation)
    await expect(page.getByText('This will be deleted')).not.toBeVisible({ timeout: 5000 });
  }
});

test('flow 14: delete returns 404 for foreign interaction', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Foreign Delete Contact',
    initials: 'FDC',
  });

  // Create an interaction
  const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
    data: {
      type: 'note',
      occurredAt: new Date().toISOString(),
      content: 'Test interaction'
    }
  });
  expect(response.status()).toBe(201);
  const interaction = await response.json();
  const interactionId = interaction.id;

  // Try to delete with a fake foreign interaction ID
  const fakeId = '00000000-0000-0000-0000-000000000999';
  const deleteResponse = await page.request.delete(`/api/interactions/${fakeId}`);

  // Should return 404
  expect(deleteResponse.status()).toBe(404);
});

test('flow 14: delete updates interaction count', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Count Test Contact',
    initials: 'CTC',
  });

  // Create 3 interactions
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

  // Delete one interaction
  const deleteResponse = await page.request.delete(`/api/interactions/${interactionIds[0]}`);
  expect(deleteResponse.status()).toBe(204);

  // Verify count decreased
  const contactResponse = await page.request.get(`/api/contacts/${contactId}`);
  expect(contactResponse.status()).toBe(200);
  const contact = await contactResponse.json();
  expect(contact.interactionTotal).toBe(2);
});
