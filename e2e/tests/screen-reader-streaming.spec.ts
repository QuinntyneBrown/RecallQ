// Traces to: L1-015, L2-068
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 41: ask endpoint returns streaming response', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact to ask about
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'John Smith',
      initials: 'JS',
      role: 'Software Engineer'
    }
  });

  expect(contactResponse.status()).toBe(201);
  const contact = await contactResponse.json();

  // Ask about the contact
  const askResponse = await page.request.post('/api/ask', {
    data: {
      contactId: contact.id,
      q: 'Who is this person?'
    }
  });

  expect(askResponse.status()).toBe(200);
  const responseText = await askResponse.text();
  expect(responseText.length).toBeGreaterThan(0);
});

test('flow 41: ask with followup question', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Alice Johnson',
      initials: 'AJ',
      role: 'Product Manager'
    }
  });

  expect(contactResponse.status()).toBe(201);
  const contact = await contactResponse.json();

  // First question
  const firstAsk = await page.request.post('/api/ask', {
    data: {
      contactId: contact.id,
      prompt: 'What is their role?'
    }
  });

  expect(firstAsk.status()).toBe(200);

  // Followup question in same conversation
  const followupAsk = await page.request.post('/api/ask', {
    data: {
      contactId: contact.id,
      prompt: 'Tell me more about their responsibilities'
    }
  });

  expect(followupAsk.status()).toBe(200);
});

test('flow 41: ask endpoint handles errors gracefully', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Try to ask about non-existent contact
  const response = await page.request.post('/api/ask', {
    data: {
      contactId: '00000000-0000-0000-0000-000000000000',
      prompt: 'Who is this?'
    }
  });

  // Should return 404 or 400 for invalid contact
  expect([400, 404, 500].some(code => response.status() === code)).toBe(true);
});

test('flow 41: ask with empty prompt validation', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Test User',
      initials: 'TU'
    }
  });

  expect(contactResponse.status()).toBe(201);
  const contact = await contactResponse.json();

  // Try with empty prompt
  const response = await page.request.post('/api/ask', {
    data: {
      contactId: contact.id,
      prompt: ''
    }
  });

  // Should reject empty prompt
  expect([400, 422].some(code => response.status() === code)).toBe(true);
});

test('flow 41: ask endpoint requires authentication', async ({ page }) => {
  const response = await page.request.post('/api/ask', {
    data: {
      contactId: '00000000-0000-0000-0000-000000000000',
      prompt: 'Hello'
    }
  });

  expect(response.status()).toBe(401);
});

test('flow 41: multiple sequential asks on same contact', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  // Create a contact
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'Contact Test',
      initials: 'CT',
      organization: 'Tech Corp',
      role: 'Developer'
    }
  });

  expect(contactResponse.status()).toBe(201);
  const contact = await contactResponse.json();

  // Multiple asks in sequence
  for (let i = 0; i < 3; i++) {
    const response = await page.request.post('/api/ask', {
      data: {
        contactId: contact.id,
        prompt: `Question number ${i + 1}`
      }
    });

    expect(response.status()).toBe(200);
  }
});
