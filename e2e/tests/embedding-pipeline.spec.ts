// Traces to: L1-018, L1-014, L2-078, L2-080
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const BACKEND_URL = 'http://localhost:5151';

test('flow 32: creating contact enqueues embedding job', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact with text that will be embedded
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'John Smith',
      initials: 'JS',
      role: 'Software Engineer',
      organization: 'Acme Corp'
    }
  });

  expect(createResponse.status()).toBe(201);
  const contact = await createResponse.json();

  // Wait a bit for embedding worker to process
  await page.waitForTimeout(500);

  // Search for the contact to verify embedding worked
  const searchResponse = await page.request.post('/api/search', {
    data: { q: 'John Smith' }
  });

  expect(searchResponse.status()).toBe(200);
  const results = await searchResponse.json();
  expect(results.results.length).toBeGreaterThan(0);
  expect(results.results[0].contactId).toBe(contact.id);
});

test('flow 32: updating contact text enqueues new embedding job', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Alice Johnson',
      initials: 'AJ',
      role: 'Manager'
    }
  });

  expect(createResponse.status()).toBe(201);
  const contact = await createResponse.json();

  await page.waitForTimeout(300);

  // Update the contact with different text
  const patchResponse = await page.request.patch(`/api/contacts/${contact.id}`, {
    data: {
      displayName: 'Alice Johnson',
      role: 'Director'  // Changed from Manager to Director
    }
  });

  expect(patchResponse.status()).toBe(200);

  await page.waitForTimeout(300);

  // Search for new text to verify re-embedding
  const searchResponse = await page.request.post('/api/search', {
    data: { q: 'Director' }
  });

  expect(searchResponse.status()).toBe(200);
  const results = await searchResponse.json();
  expect(results.results.length).toBeGreaterThan(0);
});

test('flow 32: embedding pipeline handles multiple contacts', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create multiple contacts
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const response = await page.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i}`,
        initials: `C${i}`,
        role: `Role ${i}`
      }
    });
    expect(response.status()).toBe(201);
    const contact = await response.json();
    ids.push(contact.id);
  }

  await page.waitForTimeout(500);

  // Search should find all contacts
  const searchResponse = await page.request.post('/api/search', {
    data: { q: 'contact' }
  });

  expect(searchResponse.status()).toBe(200);
  const results = await searchResponse.json();
  expect(results.results.length).toBe(5);
});

test('flow 32: search finds newly embedded contact', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contact with unique text
  const uniqueText = `UniqueCompany${Date.now()}`;
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test User',
      initials: 'TU',
      organization: uniqueText
    }
  });

  expect(createResponse.status()).toBe(201);

  await page.waitForTimeout(500);

  // Search for the unique text
  const searchResponse = await page.request.post('/api/search', {
    data: { q: uniqueText }
  });

  expect(searchResponse.status()).toBe(200);
  const results = await searchResponse.json();
  expect(results.results.length).toBe(1);
  expect(results.results[0].matchedText).toContain(uniqueText);
});

test('flow 32: embedding pipeline is idempotent', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Idempotent Test',
      initials: 'IT',
      organization: 'Test Corp'
    }
  });

  expect(createResponse.status()).toBe(201);
  const contact = await createResponse.json();

  await page.waitForTimeout(500);

  // Search first time
  const search1 = await page.request.post('/api/search', {
    data: { q: 'Idempotent' }
  });
  expect(search1.status()).toBe(200);
  const results1 = await search1.json();
  const foundCount1 = results1.results.length;

  // Wait and search again - should get same results
  await page.waitForTimeout(300);
  const search2 = await page.request.post('/api/search', {
    data: { q: 'Idempotent' }
  });
  expect(search2.status()).toBe(200);
  const results2 = await search2.json();
  const foundCount2 = results2.results.length;

  expect(foundCount1).toBe(foundCount2);
});
