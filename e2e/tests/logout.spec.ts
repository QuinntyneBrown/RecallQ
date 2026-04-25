// Traces to: L1-001, L1-013, L2-004
import { test, expect } from '@playwright/test';

test('flow 03: logout returns 204', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';

  // Register and login
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });
  expect(loginResponse.status()).toBe(200);

  // Logout
  const logoutResponse = await page.request.post('/api/auth/logout');
  expect(logoutResponse.status()).toBe(204);
});

test('flow 03: logout clears session cookie', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  // Register and login
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });
  expect(loginResponse.status()).toBe(200);

  // Logout
  const logoutResponse = await page.request.post('/api/auth/logout');
  expect(logoutResponse.status()).toBe(204);
  const cookieHeader = logoutResponse.headers()['set-cookie'];
  expect(cookieHeader).toBeTruthy();
  expect(cookieHeader).toContain('rq_auth=');
  expect(cookieHeader).toContain('expires=Thu, 01 Jan 1970');
});

test('flow 03: logout requires authentication', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';

  // Register and login
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });
  expect(loginResponse.status()).toBe(200);

  // Logout
  const firstLogout = await page.request.post('/api/auth/logout');
  expect(firstLogout.status()).toBe(204);

  // Second logout without auth should fail
  const secondLogout = await page.request.post('/api/auth/logout');
  expect(secondLogout.status()).toBe(401);
});

test('flow 03: unauthenticated logout returns 401', async ({ page }) => {
  // Logout without authentication
  const logoutResponse = await page.request.post('/api/auth/logout');
  expect(logoutResponse.status()).toBe(401);
});

test('flow 03: protected resource after logout returns 401', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';

  // Register and login
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password }
  });
  expect(loginResponse.status()).toBe(200);

  // Call protected endpoint before logout
  const beforeLogout = await page.request.get('/api/contacts');
  expect(beforeLogout.status()).toBe(200);

  // Logout
  const logoutResponse = await page.request.post('/api/auth/logout');
  expect(logoutResponse.status()).toBe(204);

  // Try to call protected endpoint after logout
  const afterLogout = await page.request.get('/api/contacts');
  expect(afterLogout.status()).toBe(401);
});
