// Traces to: L1-002, L1-018, L2-005, L2-076, L2-078
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 05: create contact with all fields returns 201', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'John Doe',
      initials: 'JD',
      role: 'CEO',
      organization: 'Acme Corp',
      location: 'San Francisco',
      tags: ['vip', 'partner'],
      emails: ['john@acme.com'],
      phones: ['555-1234'],
    }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body.displayName).toBe('John Doe');
  expect(body.initials).toBe('JD');
  expect(response.headers()['location']).toMatch(/\/api\/contacts\/[a-f0-9-]+/);
});

test('flow 05: create contact with minimal fields returns 201', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Jane Smith',
      initials: 'JS',
    }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.displayName).toBe('Jane Smith');
  expect(body.initials).toBe('JS');
  expect(body).toHaveProperty('avatarColorA');
  expect(body).toHaveProperty('avatarColorB');
});

test('flow 05: missing displayName returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      initials: 'X',
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 05: displayName > 120 chars returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const longName = 'a'.repeat(121);
  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: longName,
      initials: 'X',
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 05: missing initials returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test',
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 05: initials > 3 chars returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test',
      initials: 'ABCD',
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 05: returns Location header with created contact URI', async ({ page }) => {
  const email = `test-${Date.now()}-7@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Location Test',
      initials: 'LT',
    }
  });

  expect(response.status()).toBe(201);
  const location = response.headers()['location'];
  expect(location).toBeTruthy();
  expect(location).toMatch(/\/api\/contacts\/[a-f0-9-]+/);
});

test('flow 05: unauthenticated request returns 401', async ({ page }) => {
  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test',
      initials: 'T',
    }
  });

  expect(response.status()).toBe(401);
});

test('flow 05: avatar colors are set when not provided', async ({ page }) => {
  const email = `test-${Date.now()}-9@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Avatar Test',
      initials: 'AT',
    }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.avatarColorA).not.toBeNull();
  expect(body.avatarColorB).not.toBeNull();
});

test('flow 05: avatar colors can be provided', async ({ page }) => {
  const email = `test-${Date.now()}-10@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Custom Avatar',
      initials: 'CA',
      avatarColorA: '#FF0000',
      avatarColorB: '#00FF00',
    }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.avatarColorA).toBe('#FF0000');
  expect(body.avatarColorB).toBe('#00FF00');
});
