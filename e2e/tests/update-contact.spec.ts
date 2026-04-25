// Traces to: L1-002, L2-007, L2-078
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 08: update contact displayName returns 200', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contact
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Original Name',
      initials: 'ON',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Update displayName
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      displayName: 'Updated Name'
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body.displayName).toBe('Updated Name');
});

test('flow 08: update contact multiple fields', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Multi Field',
      initials: 'MF',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Update multiple fields
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      displayName: 'Updated Name',
      role: 'CTO',
      organization: 'Tech Corp',
      tags: ['important', 'vip'],
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body.displayName).toBe('Updated Name');
  expect(body.role).toBe('CTO');
  expect(body.organization).toBe('Tech Corp');
  expect(body.tags).toContain('important');
});

test('flow 08: update contact starred flag', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Star Test',
      initials: 'ST',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Update starred flag
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      starred: true
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body.starred).toBe(true);
});

test('flow 08: update contact emails and phones', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Contact Info',
      initials: 'CI',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Update contact info
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      emails: ['new@example.com', 'alt@example.com'],
      phones: ['555-1234', '555-5678'],
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body.emails).toContain('new@example.com');
  expect(body.phones).toContain('555-1234');
});

test('flow 08: update contact displayName > 120 chars returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test',
      initials: 'T',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Try to update with long displayName
  const longName = 'a'.repeat(121);
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      displayName: longName
    }
  });

  expect(updateResponse.status()).toBe(400);
});

test('flow 08: foreign contact id returns 404', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const fakeId = '00000000-0000-0000-0000-000000000999';
  const updateResponse = await page.request.patch(`/api/contacts/${fakeId}`, {
    data: {
      displayName: 'Attempt Update'
    }
  });

  expect(updateResponse.status()).toBe(404);
});

test('flow 08: cannot change contact id via update', async ({ page }) => {
  const email = `test-${Date.now()}-7@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Id Test',
      initials: 'IT',
    }
  });
  const originalBody = await createResponse.json();
  const contactId = originalBody.id;

  // Try to change id
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      displayName: 'Changed'
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body.id).toBe(contactId); // id should not change
});

test('flow 08: update returns contact detail DTO', async ({ page }) => {
  const email = `test-${Date.now()}-8@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'DTO Test',
      initials: 'DT',
    }
  });
  const contactId = (await createResponse.json()).id;

  // Update and verify DTO structure
  const updateResponse = await page.request.patch(`/api/contacts/${contactId}`, {
    data: {
      role: 'Manager'
    }
  });

  expect(updateResponse.status()).toBe(200);
  const body = await updateResponse.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('displayName');
  expect(body).toHaveProperty('initials');
  expect(body).toHaveProperty('role');
  expect(body).toHaveProperty('starred');
  expect(body).toHaveProperty('recentInteractions');
  expect(body).toHaveProperty('interactionTotal');
});

test('flow 08: unauthenticated update returns 401', async ({ page }) => {
  const fakeId = '00000000-0000-0000-0000-000000000999';
  const updateResponse = await page.request.patch(`/api/contacts/${fakeId}`, {
    data: {
      displayName: 'No Auth'
    }
  });

  expect(updateResponse.status()).toBe(401);
});
