// Traces to: L1-002, L2-009
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 06: list contacts returns paginated results with total count', async ({ page }) => {
  const email = `test-${Date.now()}-1@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create 5 test contacts via API
  for (let i = 0; i < 5; i++) {
    const response = await page.request.post('/api/contacts', {
      data: {
        displayName: `Test Contact ${i + 1}`,
        initials: `TC${i}`,
      }
    });
    expect(response.status()).toBe(201);
  }

  // Fetch contacts list with page size 3
  const response = await page.request.get('/api/contacts?page=1&pageSize=3&sort=recent');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('items');
  expect(body).toHaveProperty('totalCount');

  expect(Array.isArray(body.items)).toBe(true);
  expect(body.items.length).toBeLessThanOrEqual(3);
  expect(body.totalCount).toBeGreaterThanOrEqual(5);
});

test('flow 06: empty list returns zero total count', async ({ page }) => {
  const email = `test-${Date.now()}-2@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Do not create any contacts
  const response = await page.request.get('/api/contacts?page=1&pageSize=50&sort=recent');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.items).toEqual([]);
  expect(body.totalCount).toBe(0);
});

test('flow 06: page beyond end returns empty items', async ({ page }) => {
  const email = `test-${Date.now()}-3@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create only 2 contacts
  for (let i = 0; i < 2; i++) {
    const response = await page.request.post('/api/contacts', {
      data: {
        displayName: `Pagination Test ${i + 1}`,
        initials: `PT${i}`,
      }
    });
    expect(response.status()).toBe(201);
  }

  // Request page 5 with page size 3 (should be empty)
  const response = await page.request.get('/api/contacts?page=5&pageSize=3&sort=recent');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.items).toEqual([]);
});

test('flow 06: sort by name orders contacts case-insensitive', async ({ page }) => {
  const email = `test-${Date.now()}-4@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create contacts with specific names
  const names = ['zebra', 'apple', 'mango', 'banana'];
  for (const name of names) {
    const response = await page.request.post('/api/contacts', {
      data: {
        displayName: name,
        initials: name.substring(0, 2).toUpperCase(),
      }
    });
    expect(response.status()).toBe(201);
  }

  // Get sorted by name
  const response = await page.request.get('/api/contacts?page=1&pageSize=50&sort=name');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.items.length).toBeGreaterThanOrEqual(4);

  // Verify contacts are sorted alphabetically
  const displayNames = body.items.map((c: any) => c.displayName);
  const sorted = [...displayNames].sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  expect(displayNames).toEqual(sorted);
});

test('flow 06: unauthenticated request returns 401', async ({ page }) => {
  const response = await page.request.get('/api/contacts?page=1&pageSize=50&sort=recent');
  expect(response.status()).toBe(401);
});

test('flow 06: contacts API response includes required fields', async ({ page }) => {
  const email = `test-${Date.now()}-5@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact via API
  const createResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Field Test Contact',
      initials: 'FTC',
    }
  });
  expect(createResponse.status()).toBe(201);

  // Get contacts list
  const response = await page.request.get('/api/contacts?page=1&pageSize=50&sort=recent');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.items.length).toBeGreaterThan(0);
  const contact = body.items[0];
  expect(contact).toHaveProperty('id');
  expect(contact).toHaveProperty('displayName');
  expect(contact).toHaveProperty('initials');
  expect(contact).toHaveProperty('interactionTotal');
  expect(contact).toHaveProperty('lastInteraction');
  expect(contact).toHaveProperty('starred');
});
