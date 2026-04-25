// Traces to: L1-011, L2-041 through L2-046
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 39: app loads on xs viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  const response = await page.goto('http://localhost:4200');
  expect(response?.status()).toBe(200);

  await context.close();
});

test('flow 39: app loads on sm viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const page = await context.newPage();

  const response = await page.goto('http://localhost:4200');
  expect(response?.status()).toBe(200);

  await context.close();
});

test('flow 39: app loads on md viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();

  const response = await page.goto('http://localhost:4200');
  expect(response?.status()).toBe(200);

  await context.close();
});

test('flow 39: app loads on lg viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const response = await page.goto('http://localhost:4200');
  expect(response?.status()).toBe(200);

  await context.close();
});

test('flow 39: app loads on xl viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const response = await page.goto('http://localhost:4200');
  expect(response?.status()).toBe(200);

  await context.close();
});

test('flow 39: contact creation works on mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Mobile Test',
      initials: 'MT'
    }
  });

  expect(response.status()).toBe(201);

  await context.close();
});

test('flow 39: contact creation works on desktop viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Desktop Test',
      initials: 'DT'
    }
  });

  expect(response.status()).toBe(201);

  await context.close();
});

test('flow 39: search works on mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Search Contact',
      initials: 'SC'
    }
  });

  // Search for it
  const response = await page.request.post('/api/search', {
    data: { q: 'search' }
  });

  expect(response.status()).toBe(200);

  await context.close();
});

test('flow 39: search works on desktop viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Search Contact',
      initials: 'SC'
    }
  });

  // Search for it
  const response = await page.request.post('/api/search', {
    data: { q: 'search' }
  });

  expect(response.status()).toBe(200);

  await context.close();
});

test('flow 39: list contacts works across viewport sizes', async ({ browser }) => {
  // Create context with xs viewport
  const xsContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const xsPage = await xsContext.newPage();

  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(xsPage, email, password);

  // Create contacts
  for (let i = 0; i < 3; i++) {
    await xsPage.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i}`,
        initials: `C${i}`
      }
    });
  }

  // List contacts on xs
  const xsResponse = await xsPage.request.get('/api/contacts');
  expect(xsResponse.status()).toBe(200);
  const xsData = await xsResponse.json();
  expect(xsData.items.length).toBe(3);

  await xsContext.close();

  // Now test on lg viewport with same user
  const lgContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const lgPage = await lgContext.newPage();
  await registerAndLogin(lgPage, email, password);

  // List contacts on lg - should be the same
  const lgResponse = await lgPage.request.get('/api/contacts');
  expect(lgResponse.status()).toBe(200);
  const lgData = await lgResponse.json();
  expect(lgData.items.length).toBe(3);

  await lgContext.close();
});
