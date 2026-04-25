// Traces to: L1-001, L1-013, L2-001, L2-052
import { test, expect } from '@playwright/test';

test('flow 01: successful registration with valid credentials returns 201', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('email');
  expect(body.email).toBe(email);
});

test('flow 01: registration response does not contain password or hash', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  const bodyString = JSON.stringify(body);
  expect(bodyString).not.toContain(password);
  expect(bodyString.toLowerCase()).not.toContain('hash');
  expect(bodyString.toLowerCase()).not.toContain('salt');
});

test('flow 01: email already in use returns 409', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';

  // Register first user
  const firstResponse = await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  expect(firstResponse.status()).toBe(201);

  // Try to register same email
  const secondResponse = await page.request.post('/api/auth/register', {
    data: { email, password: 'differentpass123' }
  });
  expect(secondResponse.status()).toBe(409);
});

test('flow 01: password too short returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'short1';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: password without letters returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = '123456789012';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: password without digits returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'abcdefghijkl';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: invalid email format returns 400', async ({ page }) => {
  const password = 'correcthorse12';

  const response = await page.request.post('/api/auth/register', {
    data: { email: 'not-an-email', password }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: missing email returns 400', async ({ page }) => {
  const response = await page.request.post('/api/auth/register', {
    data: { password: 'correcthorse12' }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: missing password returns 400', async ({ page }) => {
  const email = `test-${Date.now()}-9@example.com`;

  const response = await page.request.post('/api/auth/register', {
    data: { email }
  });

  expect(response.status()).toBe(400);
});

test('flow 01: returns user id for successful registration', async ({ page }) => {
  const email = `test-${Date.now()}-10@example.com`;
  const password = 'correcthorse12';

  const response = await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.id).toBeTruthy();
  expect(typeof body.id).toBe('string');
});
