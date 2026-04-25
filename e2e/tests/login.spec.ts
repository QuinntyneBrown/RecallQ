// Traces to: L1-001, L1-013, L2-002
import { test, expect } from '@playwright/test';

test('flow 02: successful login with correct credentials returns 200', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(loginResponse.status()).toBe(200);
  const body = await loginResponse.json();
  expect(body).toHaveProperty('id');
  expect(body.email).toBe(email);
});

test('flow 02: wrong password returns 401', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login with wrong password
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password: 'wrongpassword1' }
  });

  expect(loginResponse.status()).toBe(401);
});

test('flow 02: unknown email returns 401', async ({ page }) => {
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email: 'nonexistent@example.com', password: 'correcthorse12' }
  });

  expect(loginResponse.status()).toBe(401);
});

test('flow 02: login response does not contain password', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(loginResponse.status()).toBe(200);
  const body = await loginResponse.json();
  const bodyString = JSON.stringify(body);
  expect(bodyString).not.toContain(password);
  expect(bodyString.toLowerCase()).not.toContain('hash');
  expect(bodyString.toLowerCase()).not.toContain('salt');
});

test('flow 02: login sets cookie', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(loginResponse.status()).toBe(200);
  const cookies = loginResponse.headers()['set-cookie'];
  expect(cookies).toBeTruthy();
  expect(cookies).toContain('rq_auth');
  expect(cookies).toContain('httponly');
});

test('flow 02: login with httponly secure cookie', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(loginResponse.status()).toBe(200);
  const cookies = loginResponse.headers()['set-cookie'];
  expect(cookies).toContain('samesite=strict');
  expect(cookies).toContain('httponly');
});

test('flow 02: remember me flag sets expiration', async ({ page }) => {
  const email = `test-${Date.now()}-7@example.com`;
  const password = 'correcthorse12';

  // Register first
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Login with remember me
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password, rememberMe: true }
  });

  expect(loginResponse.status()).toBe(200);
  const cookies = loginResponse.headers()['set-cookie'];
  // Remember me should set expires date for 30 days
  expect(cookies).toContain('expires=');
});

test('flow 02: missing email returns 401', async ({ page }) => {
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { password: 'correcthorse12' }
  });

  expect(loginResponse.status()).toBe(401);
});

test('flow 02: missing password returns 401', async ({ page }) => {
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email: 'test@example.com' }
  });

  expect(loginResponse.status()).toBe(401);
});
