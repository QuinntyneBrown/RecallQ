// Traces to: L1-004, L1-005, L2-014, L2-020, L2-082
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 18: search with no matches returns empty results', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Search for something that doesn't exist
  const response = await page.request.post('/api/search', {
    data: { q: 'nonexistentquery' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.results.length).toBe(0);
  expect(body.totalCount ?? body.contactsMatched ?? 0).toBe(0);
});

test('flow 18: empty search result includes totalCount zero', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'xyz123notfound' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.totalCount).toBe(0);
  expect(body.results.length).toBe(0);
});

test('flow 18: search response structure is consistent for zero results', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'nomatches' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('results');
  expect(body).toHaveProperty('nextPage');
  // Should have contactsMatched or totalCount
  expect(body.totalCount).toBeDefined();
});

test('flow 18: cold start search with no contacts returns zero results', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Don't create any contacts - search in empty system
  const response = await page.request.post('/api/search', {
    data: { q: 'anything' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.results.length).toBe(0);
  expect(body.totalCount).toBe(0);
});

test('flow 18: search with contacts but no match returns empty', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contacts with specific names
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Alice Smith',
      initials: 'AS',
    }
  });

  // Search for something that doesn't match
  const response = await page.request.post('/api/search', {
    data: { q: 'Zebedee' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.results.length).toBe(0);
  expect(body.totalCount).toBe(0);
});

test('flow 18: empty search nextPage is null', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'nomatch' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.nextPage).toBeNull();
});

test('flow 18: empty search with sort still returns empty', async ({ page }) => {
  const email = `test-${Date.now()}-7@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Try different sort modes on empty result
  for (const sort of ['similarity', 'recent']) {
    const response = await page.request.post('/api/search', {
      data: { q: 'nothere', sort }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBe(0);
    expect(body.totalCount).toBe(0);
  }
});
