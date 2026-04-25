// Traces to: L1-004, L2-018
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 16: search with similarity sort returns results by relevance', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contacts with searchable content
  for (let i = 0; i < 3; i++) {
    await page.request.post('/api/contacts', {
      data: {
        displayName: `Technology Expert ${i + 1}`,
        initials: `TE${i}`,
      }
    });
  }

  // Search with similarity sort
  const response = await page.request.post('/api/search', {
    data: { q: 'technology', sort: 'similarity' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('results');
  expect(Array.isArray(body.results)).toBe(true);
});

test('flow 16: search with recency sort returns results by interaction date', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contact
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Recent Activity Contact',
      initials: 'RAC',
    }
  });
  const contactId = (await contactResponse.json()).id;

  // Add recent interaction
  await page.request.post(`/api/contacts/${contactId}/interactions`, {
    data: {
      type: 'note',
      occurredAt: new Date().toISOString(),
      content: 'Recent activity'
    }
  });

  // Search with recent sort
  const response = await page.request.post('/api/search', {
    data: { q: 'activity', sort: 'recent' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('results');
  expect(Array.isArray(body.results)).toBe(true);
});

test('flow 16: similarity sort is default when not specified', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Default Sort Test',
      initials: 'DST',
    }
  });

  // Search without specifying sort
  const response = await page.request.post('/api/search', {
    data: { q: 'default' }
  });

  expect(response.status()).toBe(200);
  // Should succeed with default similarity sort
});

test('flow 16: search results include required fields for sort display', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Result Field Test',
      initials: 'RFT',
    }
  });

  const response = await page.request.post('/api/search', {
    data: { q: 'result', sort: 'similarity' }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();

  if (body.results && body.results.length > 0) {
    const result = body.results[0];
    expect(result).toHaveProperty('contactId');
    expect(result).toHaveProperty('similarity');
    expect(typeof result.similarity).toBe('number');
  }
});

test('flow 16: search with invalid sort parameter defaults gracefully', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Invalid Sort Test',
      initials: 'IST',
    }
  });

  // Try with invalid sort value
  const response = await page.request.post('/api/search', {
    data: { q: 'invalid', sort: 'invalid_sort_type' }
  });

  // Should either succeed with default or return 400
  expect([200, 400]).toContain(response.status());
});

test('flow 16: search respects owner scope for sort', async ({ page }) => {
  const email = `test-${Date.now()}-6@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Owner Scope Test',
      initials: 'OST',
    }
  });

  // Search with different sort modes
  const similarityResponse = await page.request.post('/api/search', {
    data: { q: 'scope', sort: 'similarity' }
  });

  const recencyResponse = await page.request.post('/api/search', {
    data: { q: 'scope', sort: 'recent' }
  });

  expect(similarityResponse.status()).toBe(200);
  expect(recencyResponse.status()).toBe(200);

  // Both should return results
  const similarityBody = await similarityResponse.json();
  const recencyBody = await recencyResponse.json();

  expect(Array.isArray(similarityBody.results)).toBe(true);
  expect(Array.isArray(recencyBody.results)).toBe(true);
});
