// Traces to: L1-016, L2-069, L2-071
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test('flow 37: response includes X-Correlation-Id header', async ({ page }) => {
  const response = await page.request.get('/api/ping');
  expect(response.status()).toBe(200);

  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
});

test('flow 37: X-Correlation-Id is valid GUID format', async ({ page }) => {
  const response = await page.request.post('/api/auth/register', {
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'correcthorse12'
    }
  });

  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
});

test('flow 37: client-provided X-Correlation-Id is honored', async ({ page }) => {
  const clientCorrelationId = '550e8400-e29b-41d4-a716-446655440000';

  const response = await page.request.get('/api/ping', {
    headers: { 'X-Correlation-Id': clientCorrelationId }
  });

  expect(response.status()).toBe(200);
  const returnedId = response.headers()['x-correlation-id'];
  expect(returnedId).toBe(clientCorrelationId);
});

test('flow 37: authenticated request includes correlation id', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(200);

  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
});

test('flow 37: search endpoint includes correlation id', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'test' }
  });

  expect(response.status()).toBe(200);
  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
});

test('flow 37: different requests get different correlation ids', async ({ page }) => {
  const response1 = await page.request.get('/api/ping');
  const correlationId1 = response1.headers()['x-correlation-id'];

  // Small delay to ensure different IDs
  await page.waitForTimeout(10);

  const response2 = await page.request.get('/api/ping');
  const correlationId2 = response2.headers()['x-correlation-id'];

  expect(correlationId1).not.toBe(correlationId2);
});

test('flow 37: invalid X-Correlation-Id is replaced with generated id', async ({ page }) => {
  const response = await page.request.get('/api/ping', {
    headers: { 'X-Correlation-Id': 'not-a-guid' }
  });

  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
  expect(correlationId).not.toBe('not-a-guid');
});

test('flow 37: error response includes correlation id', async ({ page }) => {
  // Try to access a protected endpoint without auth
  const response = await page.request.get('/api/contacts');
  expect(response.status()).toBe(401);

  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toBeDefined();
  expect(correlationId).toMatch(GUID_PATTERN);
});
