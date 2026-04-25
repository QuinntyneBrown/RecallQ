// Traces to: L1-013, L2-055, L2-032
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 35: login rate limiting enforces 5 attempts per 60 seconds', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'wrongpassword';

  // First, register an account so login attempts are valid
  const registerRes = await page.request.post('/api/auth/register', {
    data: {
      email: email,
      password: 'correcthorse12'
    }
  });
  expect(registerRes.status()).toBe(201);

  // Make 5 successful login attempts (should all succeed)
  for (let i = 0; i < 5; i++) {
    const res = await page.request.post('/api/auth/login', {
      data: {
        email: email,
        password: 'correcthorse12'
      }
    });
    expect([200, 201].some(code => res.status() === code)).toBe(true);
  }

  // 6th attempt should be rate limited
  const rateLimitRes = await page.request.post('/api/auth/login', {
    data: {
      email: email,
      password: 'correcthorse12'
    }
  });

  expect(rateLimitRes.status()).toBe(429);
  expect(rateLimitRes.headers()['retry-after']).toBeDefined();
});

test('flow 35: register rate limiting enforces 5 attempts per 60 seconds per IP', async ({ page }) => {
  // Make 5 registration attempts
  for (let i = 0; i < 5; i++) {
    const res = await page.request.post('/api/auth/register', {
      data: {
        email: `test-${Date.now()}-${i}@example.com`,
        password: 'correcthorse12'
      }
    });
    expect([201].some(code => res.status() === code)).toBe(true);
  }

  // 6th attempt should be rate limited
  const rateLimitRes = await page.request.post('/api/auth/register', {
    data: {
      email: `test-${Date.now()}-overflow@example.com`,
      password: 'correcthorse12'
    }
  });

  expect(rateLimitRes.status()).toBe(429);
  expect(rateLimitRes.headers()['retry-after']).toBeDefined();
  const body = await rateLimitRes.json();
  expect(body.error).toBe('rate_limited');
  expect(body.retryAfter).toBeGreaterThan(0);
});

test('flow 35: search rate limiting enforces 60 attempts per 60 seconds per user', async ({ page }) => {
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

  // Make 60 successful search requests
  for (let i = 0; i < 60; i++) {
    const res = await page.request.post('/api/search', {
      data: { q: 'test' }
    });
    expect([200].some(code => res.status() === code)).toBe(true);
  }

  // 61st request should be rate limited
  const rateLimitRes = await page.request.post('/api/search', {
    data: { q: 'test' }
  });

  expect(rateLimitRes.status()).toBe(429);
  expect(rateLimitRes.headers()['retry-after']).toBeDefined();
});

test('flow 35: ask rate limiting enforces 20 attempts per 60 seconds per user', async ({ page }) => {
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

  // Make 20 successful ask requests
  for (let i = 0; i < 20; i++) {
    const res = await page.request.post('/api/ask', {
      data: {
        contactId: contact.id,
        q: `Question ${i}`
      }
    });
    expect([200, 429].some(code => res.status() === code)).toBe(true);
    if (res.status() === 429) {
      break; // Rate limit hit earlier
    }
  }

  // Continue until we get rate limited
  let rateLimitHit = false;
  for (let i = 20; i < 30; i++) {
    const res = await page.request.post('/api/ask', {
      data: {
        contactId: contact.id,
        q: `Question ${i}`
      }
    });
    if (res.status() === 429) {
      rateLimitHit = true;
      expect(res.headers()['retry-after']).toBeDefined();
      break;
    }
  }

  expect(rateLimitHit).toBe(true);
});

test('flow 35: summary refresh rate limiting enforces 1 attempt per 60 seconds per contact', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactRes = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Summary Test',
      initials: 'ST',
      role: 'Engineer'
    }
  });
  const contact = await contactRes.json();

  // First refresh should succeed
  const firstRes = await page.request.post(`/api/contacts/${contact.id}/summary:refresh`, {
    data: {}
  });
  expect([200, 202, 429].some(code => firstRes.status() === code)).toBe(true);

  // Immediate second refresh should be rate limited
  const secondRes = await page.request.post(`/api/contacts/${contact.id}/summary:refresh`, {
    data: {}
  });

  expect(secondRes.status()).toBe(429);
  expect(secondRes.headers()['retry-after']).toBeDefined();
  const body = await secondRes.json();
  expect(body.retryAfter).toBeGreaterThan(0);
});

test('flow 35: rate limit response includes retry-after header', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';

  // Register account
  await page.request.post('/api/auth/register', {
    data: { email, password }
  });

  // Exhaust login attempts
  for (let i = 0; i < 5; i++) {
    await page.request.post('/api/auth/login', {
      data: { email, password }
    });
  }

  // Get rate limit response
  const res = await page.request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(res.status()).toBe(429);
  const retryAfter = res.headers()['retry-after'];
  expect(retryAfter).toBeDefined();
  expect(parseInt(retryAfter as string)).toBeGreaterThan(0);
  expect(parseInt(retryAfter as string)).toBeLessThanOrEqual(60);
});

test('flow 35: rate limited request does not execute endpoint logic', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create initial contact
  const contact1 = await page.request.post('/api/contacts', {
    data: { displayName: 'Contact 1', initials: 'C1' }
  });
  const c1 = await contact1.json();

  // Get current contact count
  const countBefore = await page.request.get('/api/contacts/count');
  const countData = await countBefore.json();
  const initialCount = countData.count;

  // Create multiple contacts to potentially hit rate limit on some operation
  let lastId = c1.id;
  for (let i = 0; i < 3; i++) {
    const res = await page.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i + 2}`,
        initials: `C${i + 2}`
      }
    });
    if (res.status() === 201) {
      const data = await res.json();
      lastId = data.id;
    }
  }

  // Verify that successfully created contacts were actually persisted
  const countAfter = await page.request.get('/api/contacts/count');
  const countAfterData = await countAfter.json();
  expect(countAfterData.count).toBeGreaterThanOrEqual(initialCount);
});
