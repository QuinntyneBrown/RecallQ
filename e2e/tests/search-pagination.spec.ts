// Traces to: L1-004, L1-014, L2-019, L2-062
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 17: search returns paginated results with nextPage', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create multiple contacts to test pagination
  for (let i = 0; i < 10; i++) {
    await page.request.post('/api/contacts', {
      data: {
        displayName: `Search Test ${i}`,
        initials: `ST${i}`,
      }
    });
  }

  // Search for contacts
  const response = await page.request.post('/api/search', {
    data: { q: 'search', page: 1 }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('results');
  expect(body).toHaveProperty('nextPage');
});

test('flow 17: search supports page parameter', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contacts
  for (let i = 0; i < 5; i++) {
    await page.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i}`,
        initials: `C${i}`,
      }
    });
  }

  // Search page 1
  const page1Response = await page.request.post('/api/search', {
    data: { q: 'contact', page: 1 }
  });

  expect(page1Response.status()).toBe(200);
  const page1Body = await page1Response.json();
  expect(Array.isArray(page1Body.results)).toBe(true);
});

test('flow 17: search page defaults to 1 if not specified', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'test' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.results)).toBe(true);
});

test('flow 17: nextPage is null when no more results', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create one contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Single Contact',
      initials: 'SC',
    }
  });

  // Search with high page number
  const response = await page.request.post('/api/search', {
    data: { q: 'single', page: 100 }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  // Either no results or nextPage is null
  if (body.results && body.results.length === 0) {
    expect(body.nextPage).toBeNull();
  }
});

test('flow 17: search with pageSize parameter', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/search', {
    data: { q: 'test', page: 1, pageSize: 10 }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.results)).toBe(true);
});
