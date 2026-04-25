// Traces to: L1-009, L2-034, L2-035, L2-036, L2-083
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('flow 07: get contact detail returns contact with recent interactions', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactId = await createContact(page, {
    displayName: 'Detail Test Contact',
    initials: 'DTC',
  });

  // Add some interactions
  for (let i = 0; i < 5; i++) {
    const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: i % 2 === 0 ? 'email' : 'call',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: `Interaction ${i}`
      }
    });
    expect(response.status()).toBe(201);
  }

  // Get contact detail
  const response = await page.request.get(`/api/contacts/${contactId}?take=3`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('displayName');
  expect(body.displayName).toBe('Detail Test Contact');
  expect(body).toHaveProperty('recentInteractions');
  expect(Array.isArray(body.recentInteractions)).toBe(true);
  expect(body.recentInteractions.length).toBeLessThanOrEqual(3);
  expect(body).toHaveProperty('interactionTotal');
  expect(body.interactionTotal).toBe(5);
});

test('flow 07: contact detail with no interactions returns empty array', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'No Interactions Contact',
    initials: 'NIC',
  });

  const response = await page.request.get(`/api/contacts/${contactId}?take=3`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.recentInteractions).toEqual([]);
  expect(body.interactionTotal).toBe(0);
});

test('flow 07: foreign contact id returns 404', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const fakeId = '00000000-0000-0000-0000-000000000999';
  const response = await page.request.get(`/api/contacts/${fakeId}?take=3`);
  expect(response.status()).toBe(404);
});

test('flow 07: missing contact id returns 404', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact, then delete it
  const contactId = await createContact(page, {
    displayName: 'To Delete',
    initials: 'TD',
  });

  const deleteResponse = await page.request.delete(`/api/contacts/${contactId}`);
  expect(deleteResponse.status()).toBe(204);

  // Try to fetch deleted contact
  const response = await page.request.get(`/api/contacts/${contactId}?take=3`);
  expect(response.status()).toBe(404);
});

test('flow 07: contact detail includes all required profile fields', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Profile Test',
    initials: 'PT',
  });

  const response = await page.request.get(`/api/contacts/${contactId}?take=3`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('displayName');
  expect(body).toHaveProperty('initials');
  expect(body).toHaveProperty('starred');
  expect(body).toHaveProperty('role');
  expect(body).toHaveProperty('organization');
  expect(body).toHaveProperty('location');
  expect(body).toHaveProperty('tags');
  expect(body).toHaveProperty('emails');
  expect(body).toHaveProperty('phones');
});

test('flow 07: take parameter limits recent interactions', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Take Limit Test',
    initials: 'TLT',
  });

  // Add 10 interactions
  for (let i = 0; i < 10; i++) {
    const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: 'note',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: `Interaction ${i}`
      }
    });
    expect(response.status()).toBe(201);
  }

  // Get with take=5
  const response = await page.request.get(`/api/contacts/${contactId}?take=5`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.recentInteractions.length).toBe(5);
  expect(body.interactionTotal).toBe(10);
});

test('flow 07: recent interactions are ordered by most recent first', async ({ page }) => {
  const email = `test-${Date.now()}-7@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Order Test',
    initials: 'OT',
  });

  // Add interactions with known order
  const interactionTexts = ['first', 'second', 'third'];
  for (let i = 0; i < interactionTexts.length; i++) {
    const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: 'note',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: interactionTexts[i]
      }
    });
    expect(response.status()).toBe(201);
  }

  const response = await page.request.get(`/api/contacts/${contactId}?take=10`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.recentInteractions.length).toBe(3);
  // Most recent (created at current time) should be first
  expect(body.recentInteractions[0].content).toBe('first');
  expect(body.recentInteractions[1].content).toBe('second');
  expect(body.recentInteractions[2].content).toBe('third');
});
