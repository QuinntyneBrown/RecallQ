// Traces to: L1-013, L2-006, L2-056
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('flow 36: user cannot access another user\'s contacts', async ({ page, context }) => {
  // Create two users
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 registers and creates a contact
  await registerAndLogin(page, email1, password);
  const contactResponse = await page.request.post('/api/contacts', {
    data: {
      displayName: 'User1 Contact',
      initials: 'U1'
    }
  });
  expect(contactResponse.status()).toBe(201);
  const contact = await contactResponse.json();
  const contactId = contact.id;

  // Logout User 1
  await page.request.post('/api/auth/logout');

  // Create new context for User 2
  const context2 = await context.browser()?.newContext();
  const page2 = await context2!.newPage();

  // User 2 registers
  await registerAndLogin(page2, email2, password);

  // User 2 tries to access User 1's contact
  const getResponse = await page2.request.get(`/api/contacts/${contactId}`);
  expect(getResponse.status()).toBe(404);

  await context2!.close();
});

test('flow 36: user cannot delete another user\'s contacts', async ({ browser }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates a contact (separate context)
  const context1 = await browser!.newContext();
  const page1 = await context1.newPage();
  await registerAndLogin(page1, email1, password);
  const contactResponse = await page1.request.post('/api/contacts', {
    data: {
      displayName: 'Delete Test Contact',
      initials: 'DTC'
    }
  });
  const contact = await contactResponse.json();
  const contactId = contact.id;

  // User 2 tries to delete User 1's contact (separate context)
  const context2 = await browser!.newContext();
  const page2 = await context2.newPage();
  await registerAndLogin(page2, email2, password);

  const deleteResponse = await page2.request.delete(`/api/contacts/${contactId}`);
  expect(deleteResponse.status()).toBe(404);

  // Verify contact still exists for User 1
  const verifyResponse = await page1.request.get(`/api/contacts/${contactId}`);
  expect(verifyResponse.status()).toBe(200);

  await context1.close();
  await context2.close();
});

test('flow 36: user cannot update another user\'s contacts', async ({ browser }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates a contact (separate context)
  const context1 = await browser!.newContext();
  const page1 = await context1.newPage();
  await registerAndLogin(page1, email1, password);
  const contactResponse = await page1.request.post('/api/contacts', {
    data: {
      displayName: 'Original Name',
      initials: 'ON'
    }
  });
  const contact = await contactResponse.json();
  const contactId = contact.id;

  // User 2 tries to update User 1's contact (separate context)
  const context2 = await browser!.newContext();
  const page2 = await context2.newPage();
  await registerAndLogin(page2, email2, password);

  const patchResponse = await page2.request.patch(`/api/contacts/${contactId}`, {
    data: {
      starred: true
    }
  });
  expect(patchResponse.status()).toBe(404);

  // Verify contact unchanged for User 1
  const verifyResponse = await page1.request.get(`/api/contacts/${contactId}`);
  expect(verifyResponse.status()).toBe(200);
  const verified = await verifyResponse.json();
  expect(verified.starred).toBe(false);

  await context1.close();
  await context2.close();
});

test('flow 36: contacts list is scoped to owner', async ({ page, context }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates 2 contacts
  await registerAndLogin(page, email1, password);
  for (let i = 0; i < 2; i++) {
    await page.request.post('/api/contacts', {
      data: {
        displayName: `User1 Contact ${i}`,
        initials: `U${i}`
      }
    });
  }

  const list1 = await page.request.get('/api/contacts');
  const data1 = await list1.json();
  expect(data1.items.length).toBe(2);

  await page.request.post('/api/auth/logout');

  // User 2 registers and lists contacts (should be empty)
  const context2 = await context.browser()?.newContext();
  const page2 = await context2!.newPage();
  await registerAndLogin(page2, email2, password);

  const list2 = await page2.request.get('/api/contacts');
  const data2 = await list2.json();
  expect(data2.items.length).toBe(0);

  // User 2 creates 1 contact
  await page2.request.post('/api/contacts', {
    data: {
      displayName: 'User2 Contact',
      initials: 'U2'
    }
  });

  const list2b = await page2.request.get('/api/contacts');
  const data2b = await list2b.json();
  expect(data2b.items.length).toBe(1);

  await context2!.close();
});

test('flow 36: interactions are scoped to owner', async ({ context }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates contact with interaction
  const page1 = await context.newPage();
  await registerAndLogin(page1, email1, password);
  const contactResponse = await page1.request.post('/api/contacts', {
    data: {
      displayName: 'Interaction Test',
      initials: 'IT'
    }
  });
  const contact = await contactResponse.json();

  const interactionResponse = await page1.request.post(
    `/api/contacts/${contact.id}/interactions`,
    {
      data: {
        type: 'note',
        content: 'User1 interaction'
      }
    }
  );
  if (interactionResponse.status() !== 201) {
    console.log('Interaction creation failed:', await interactionResponse.text());
  }
  expect([201, 202].some(code => interactionResponse.status() === code)).toBe(true);
  await page1.close();

  // User 2 tries to access User 1's contact's interactions
  const page2 = await context.newPage();
  await registerAndLogin(page2, email2, password);

  const getResponse = await page2.request.get(`/api/contacts/${contact.id}/interactions`);
  expect(getResponse.status()).toBe(404);
  await page2.close();
});

test('flow 36: search results are scoped to owner', async ({ page, context }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates a distinctive contact
  await registerAndLogin(page, email1, password);
  await page.request.post('/api/contacts', {
    data: {
      displayName: 'UniqueSearchableContact',
      initials: 'USC'
    }
  });

  // Wait for embedding
  await new Promise(r => setTimeout(r, 1000));

  // User 1 searches and finds it
  const search1 = await page.request.post('/api/search', {
    data: { q: 'UniqueSearchable' }
  });
  const data1 = await search1.json();
  const user1Found = data1.results?.length > 0;

  await page.request.post('/api/auth/logout');

  // User 2 searches for the same term
  const context2 = await context.browser()?.newContext();
  const page2 = await context2!.newPage();
  await registerAndLogin(page2, email2, password);

  const search2 = await page2.request.post('/api/search', {
    data: { q: 'UniqueSearchable' }
  });
  const data2 = await search2.json();
  const user2Found = data2.results?.length > 0;

  // User 1 should find it, User 2 should not
  expect(user1Found).toBe(true);
  expect(user2Found).toBe(false);

  await context2!.close();
});

test('flow 36: count endpoint is scoped to owner', async ({ page, context }) => {
  const email1 = `user1-${Date.now()}-${Math.random()}@example.com`;
  const email2 = `user2-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correcthorse12';

  // User 1 creates 3 contacts
  await registerAndLogin(page, email1, password);
  for (let i = 0; i < 3; i++) {
    await page.request.post('/api/contacts', {
      data: {
        displayName: `Contact ${i}`,
        initials: `C${i}`
      }
    });
  }

  const count1 = await page.request.get('/api/contacts/count');
  const data1 = await count1.json();
  expect(data1.contacts).toBe(3);

  await page.request.post('/api/auth/logout');

  // User 2 checks count (should be 0)
  const context2 = await context.browser()?.newContext();
  const page2 = await context2!.newPage();
  await registerAndLogin(page2, email2, password);

  const count2 = await page2.request.get('/api/contacts/count');
  const data2 = await count2.json();
  expect(data2.contacts).toBe(0);

  await context2!.close();
});
