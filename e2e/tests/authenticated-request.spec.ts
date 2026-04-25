// Traces to: L1-001, L1-013, L2-003, L2-006, L2-056
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 04: unauthenticated request to protected endpoint returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(401);
});

test('flow 04: malformed bearer token returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts', {
    headers: { 'Authorization': 'Bearer invalid' }
  });
  expect(response.status()).toBe(401);
});

test('flow 04: missing authorization header returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(401);
});

test('flow 04: authenticated request to protected endpoint succeeds', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';

  await registerAndLogin(page, email, password);

  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('items');
});

test('flow 04: authenticated user cannot access foreign user contact', async ({ page }) => {
  const email1 = `test-${Date.now()}-1@example.com`;
  const email2 = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  // Create user 1 and contact
  await registerAndLogin(page, email1, password);
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'User 1 Contact',
      initials: 'U1C',
    }
  });
  expect(contactResponse.status()).toBe(201);
  const contactId = (await contactResponse.json()).id;

  // Create user 2 and try to access user 1's contact
  const register2 = await page.request.post('/api/auth/register', {
    data: { email: email2, password }
  });
  expect(register2.status()).toBe(201);

  const login2 = await page.request.post('/api/auth/login', {
    data: { email: email2, password }
  });
  expect(login2.status()).toBe(200);

  // Try to access user 1's contact as user 2
  const accessResponse = await page.request.get(`/api/contacts/${contactId}`);
  expect(accessResponse.status()).toBe(404);
});

test('flow 04: authenticated user can access own contact', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  await registerAndLogin(page, email, password);

  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'My Contact',
      initials: 'MC',
    }
  });
  expect(createResponse.status()).toBe(201);
  const contactId = (await createResponse.json()).id;

  // Access own contact
  const getResponse = await page.request.get(`/api/contacts/${contactId}`);
  expect(getResponse.status()).toBe(200);
  const body = await getResponse.json();
  expect(body.displayName).toBe('My Contact');
});

test('flow 04: /api/ping does not require authentication', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
});

test('flow 04: /api/auth/register does not require authentication', async ({ page }) => {
  const response = await page.request.post('/api/auth/register', {
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'correcthorse12'
    }
  });
  expect(response.status()).toBe(201);
});

test('flow 04: protected endpoint returns results only for current user', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';

  await registerAndLogin(page, email, password);

  // Create a contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test Contact',
      initials: 'TC',
    }
  });

  // List contacts - should include our contact
  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items[0].displayName).toBe('Test Contact');
});
