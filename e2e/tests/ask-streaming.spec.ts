// Traces to: L1-005, L1-014, L2-021, L2-022, L2-061
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 19: ask streaming endpoint available', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact to ask about
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Sarah Mitchell',
      initials: 'SM',
      role: 'VP Product'
    }
  });

  expect(contactResponse.status()).toBe(201);

  // Ask endpoint should be available
  const askResponse = await page.request.post('/api/ask', {
    data: {
      q: 'Who is Sarah?'
    }
  });

  // Ask should succeed or rate limit (not 404)
  expect([200, 429].some(code => askResponse.status() === code)).toBe(true);
});

test('flow 19: ask respects authentication', async ({ page }) => {
  const response = await page.request.post('/api/ask', {
    data: {
      q: 'test question'
    }
  });

  expect(response.status()).toBe(401);
});

test('flow 19: ask rejects empty question', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const response = await page.request.post('/api/ask', {
    data: {
      q: ''
    }
  });

  expect(response.status()).toBe(400);
});

test('flow 19: ask validates question length', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Question over 1000 chars
  const longQuestion = 'a'.repeat(1001);
  const response = await page.request.post('/api/ask', {
    data: {
      q: longQuestion
    }
  });

  expect(response.status()).toBe(400);
});
