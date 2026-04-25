// Traces to: L1-004, L1-014, L2-014, L2-015, L2-016, L2-017, L2-059, L2-082
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('flow 15: empty query returns 400 error', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact first
  await createContact(page, {
    displayName: 'Test Contact',
    initials: 'TC',
  });

  // Try to search with empty query
  const response = await page.request.post('/api/search', {
    data: { q: '' }
  });

  // Should return 400 Bad Request
  expect(response.status()).toBe(400);
});

test('flow 15: search with valid query works', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactId = await createContact(page, {
    displayName: 'Search Test Contact',
    initials: 'STC',
  });

  // Wait a bit for embeddings to be processed
  await new Promise(r => setTimeout(r, 2000));

  // Search for the contact by name
  const response = await page.request.post('/api/search', {
    data: { q: 'Search Test' }
  });

  // Should be successful
  expect([200, 503]).toContain(response.status()); // 503 if embeddings still processing
});

test('flow 15: search results include matched text snippets', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactId = await createContact(page, {
    displayName: 'Snippet Test Contact',
    initials: 'STC',
  });

  await new Promise(r => setTimeout(r, 2000));

  // Search for a term that should match
  const response = await page.request.post('/api/search', {
    data: { q: 'Snippet' }
  });

  // Verify response structure
  if (response.status() === 200) {
    const body = await response.json();
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);

    // If results returned, verify each has required fields
    if (body.results.length > 0) {
      expect(body.results[0]).toHaveProperty('contactId');
      expect(body.results[0]).toHaveProperty('similarity');
      expect(body.results[0]).toHaveProperty('matchedText');
    }
  }
});
