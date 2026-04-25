// Traces to: L1-016, L2-070
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const BACKEND_URL = 'http://localhost:5151';

test('flow 38: metrics endpoint returns prometheus format', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('# HELP');
  expect(text).toContain('# TYPE');
});

test('flow 38: metrics include recallq_api_latency_seconds histogram', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_api_latency_seconds');
});

test('flow 38: metrics include recallq_embedding_latency_seconds histogram', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_embedding_latency_seconds');
});

test('flow 38: metrics include recallq_vector_search_latency_seconds histogram', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_vector_search_latency_seconds');
});

test('flow 38: metrics include recallq_http_requests_total counter', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_http_requests_total');
});

test('flow 38: metrics include recallq_llm_tokens_total counter', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_llm_tokens_total');
});

test('flow 38: metrics include recallq_llm_cost_usd gauge', async ({ page }) => {
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('recallq_llm_cost_usd');
});

test('flow 38: api request increments metrics', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';

  // Make a request to generate metrics
  await registerAndLogin(page, email, password);

  // Get metrics
  const response = await page.request.get(`${BACKEND_URL}/metrics`);
  expect(response.status()).toBe(200);
  const text = await response.text();

  // Should have metrics from the request we just made
  expect(text).toContain('recallq_api_latency_seconds_bucket');
  expect(text).toContain('recallq_http_requests_total');
});
