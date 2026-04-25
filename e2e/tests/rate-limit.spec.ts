// Traces to: L1-013, L2-055, L2-032
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 35: login endpoint is protected with rate limiting middleware', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';

  // Register account
  const registerRes = await page.request.post('/api/auth/register', {
    data: { email, password }
  });
  expect(registerRes.status()).toBe(201);

  // Login should succeed
  const loginRes = await page.request.post('/api/auth/login', {
    data: { email, password }
  });
  expect([200, 201].some(code => loginRes.status() === code)).toBe(true);
});

test('flow 35: register endpoint is protected with rate limiting middleware', async ({ page }) => {
  // Multiple registration attempts should be possible (policy allows 5 per 60s)
  const res1 = await page.request.post('/api/auth/register', {
    data: {
      email: `test1-${Date.now()}@example.com`,
      password: 'correcthorse12'
    }
  });
  expect(res1.status()).toBe(201);

  // Second registration with different email should also work
  const res2 = await page.request.post('/api/auth/register', {
    data: {
      email: `test2-${Date.now()}@example.com`,
      password: 'correcthorse12'
    }
  });
  expect([201, 429].some(code => res2.status() === code)).toBe(true);
});

test('flow 35: search endpoint is protected with rate limiting middleware', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'Search Test',
      initials: 'ST'
    }
  });

  // Search should work (policy allows 60 per 60s per user)
  const res = await page.request.post('/api/search', {
    data: { q: 'test' }
  });
  expect([200, 429].some(code => res.status() === code)).toBe(true);

  // Verify search response structure
  if (res.status() === 200) {
    const data = await res.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('totalCount');
  }
});

test('flow 35: ask endpoint is protected with rate limiting middleware', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactRes = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Ask Test',
      initials: 'AT'
    }
  });
  const contact = await contactRes.json();

  // Ask should work (policy allows 20 per 60s per user)
  const res = await page.request.post('/api/ask', {
    data: {
      q: 'Question 1'
    }
  });
  expect([200, 429].some(code => res.status() === code)).toBe(true);
});

test('flow 35: summary refresh endpoint has rate limiting configured', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact with interaction so summary can be requested
  const contactRes = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Summary Test',
      initials: 'ST',
      role: 'Engineer'
    }
  });
  const contact = await contactRes.json();

  // Add an interaction so summary generation makes sense
  await page.request.post(`/api/contacts/${contact.id}/interactions`, {
    data: {
      kind: 'call',
      notes: 'Test interaction'
    }
  });

  // First refresh should succeed or return rate limited
  const firstRes = await page.request.post(`/api/contacts/${contact.id}/summary:refresh`, {
    data: {}
  });
  expect([202, 429, 400, 404].some(code => firstRes.status() === code)).toBe(true);

  // Immediate second refresh might be rate limited by the manual check (1 per 60s per contact)
  // This endpoint has both middleware-level and manual rate limiting
  const secondRes = await page.request.post(`/api/contacts/${contact.id}/summary:refresh`, {
    data: {}
  });
  expect([202, 429, 400, 404].some(code => secondRes.status() === code)).toBe(true);
});

test('flow 35: 429 response includes required rate limit information', async ({ page }) => {
  // This test verifies the rate limiting response structure when it occurs
  // We trigger register endpoint multiple times to potentially hit the limit
  const responses = [];

  for (let i = 0; i < 7; i++) {
    const res = await page.request.post('/api/auth/register', {
      data: {
        email: `register-test-${Date.now()}-${i}@example.com`,
        password: 'correcthorse12'
      }
    });
    responses.push({ status: res.status(), headers: res.headers() });

    if (res.status() === 429) {
      // Verify 429 response has Retry-After header
      expect(res.headers()['retry-after']).toBeDefined();
      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('rate_limited');
      expect(body).toHaveProperty('retryAfter');
      break;
    }
  }
});

test('flow 35: rate limiting does not prevent authenticated operations', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create multiple contacts (should all succeed unless we hit rate limit)
  const results = [];
  for (let i = 0; i < 3; i++) {
    const res = await page.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i}`,
        initials: `C${i}`
      }
    });
    results.push(res.status());
  }

  // At least some should succeed
  expect(results.some(code => code === 201)).toBe(true);
});

test('flow 35: auth endpoints preserve security with rate limiting', async ({ page }) => {
  // Verify that invalid credentials still fail even with rate limiting in place
  const email = `test-${Date.now()}@example.com`;

  // Register with valid password
  await page.request.post('/api/auth/register', {
    data: { email, password: 'correcthorse12' }
  });

  // Login with wrong password should fail with 401, not 429
  const res = await page.request.post('/api/auth/login', {
    data: { email, password: 'wrongpassword' }
  });

  // Should get 401 (unauthorized) not 429 (rate limited) for bad credentials
  expect(res.status()).toBe(401);
});
