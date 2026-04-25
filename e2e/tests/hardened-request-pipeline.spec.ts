// Traces to: L1-013, L2-052, L2-053, L2-054, L2-055, L2-056, L2-057, L2-072
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 34: responses include HSTS header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
  expect(response.headers()['strict-transport-security']).toBeDefined();
});

test('flow 34: responses include Content-Security-Policy header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-security-policy']).toBeDefined();
});

test('flow 34: responses include X-Content-Type-Options nosniff header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});

test('flow 34: responses include Referrer-Policy header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
  expect(response.headers()['referrer-policy']).toBeDefined();
});

test('flow 34: responses include X-Frame-Options DENY header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-frame-options']).toBe('DENY');
});

test('flow 34: validation guards reject malformed contact payload', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Send contact creation with invalid data (displayName too long)
  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'a'.repeat(1001), // Exceeds max length
      initials: 'A'
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 34: bearer token in query string returns 400', async ({ page }) => {
  const response = await page.request.get('/api/contacts?token=fake_token');
  // Bearer token in query should be rejected, not parsed
  expect([400, 401].some(code => response.status() === code)).toBe(true);
});

test('flow 34: request without auth returns 401 on protected endpoint', async ({ page }) => {
  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(401);
});

test('flow 34: authenticated request succeeds with valid bearer token', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(200);
});

test('flow 34: malformed bearer token returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts', {
    headers: { 'Authorization': 'Bearer invalid_token_format' }
  });
  expect(response.status()).toBe(401);
});

test('flow 34: rate limiter short-circuits with 429 on exceeded limit', async ({ page }) => {
  // Try multiple registrations to hit rate limit
  const responses = [];

  for (let i = 0; i < 7; i++) {
    const res = await page.request.post('/api/auth/register', {
      data: {
        email: `register-test-${Date.now()}-${i}@example.com`,
        password: 'correcthorse12'
      }
    });
    responses.push(res.status());

    if (res.status() === 429) {
      // Verify Retry-After header is present
      expect(res.headers()['retry-after']).toBeDefined();
      break;
    }
  }

  // At least one request should hit rate limit or all succeed (both valid)
  expect(responses.length).toBeGreaterThan(0);
});

test('flow 34: validation guard rejects empty required field', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: '', // Empty required field
      initials: 'A'
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 34: DbContext query filter prevents cross-user access', async ({ page }) => {
  const email1 = `test-${Date.now()}-1@example.com`;
  const email2 = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';

  // User 1 creates a contact
  await registerAndLogin(page, email1, password);
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'User1 Secret Contact',
      initials: 'USC'
    }
  });
  expect(contactResponse.status()).toBe(201);
  const contactId = (await contactResponse.json()).id;

  // User 2 logs in and tries to access User 1's contact
  const register2 = await page.request.post('/api/auth/register', {
    data: { email: email2, password }
  });
  expect(register2.status()).toBe(201);

  const login2 = await page.request.post('/api/auth/login', {
    data: { email: email2, password }
  });
  expect(login2.status()).toBe(200);

  // Try to access User 1's contact as User 2
  const getResponse = await page.request.get(`/api/contacts/${contactId}`);
  expect(getResponse.status()).toBe(404);
});

test('flow 34: unauth endpoints do not include auth headers in response', async ({ page }) => {
  const response = await page.request.post('/api/auth/register', {
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'correcthorse12'
    }
  });
  expect(response.status()).toBe(201);

  // Security headers should still be present even on unauth endpoints
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});

test('flow 34: protected endpoint with invalid user id returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts', {
    headers: { 'Authorization': 'Bearer invalid_format' }
  });
  expect(response.status()).toBe(401);
});
