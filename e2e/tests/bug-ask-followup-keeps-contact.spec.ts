// Covers bug: docs/bugs/ask-followup-loses-contact-scope.md
// A follow-up chip turn must preserve the contactId scope so the
// LLM continues to answer about the same contact.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('follow-up chip keeps contactId on the next /api/ask post', async ({ page }) => {
  const email = `fu-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, { displayName: 'FU Target', initials: 'FU' });

  const seenContactIds: (string | undefined)[] = [];
  await page.route('**/api/ask', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    seenContactIds.push(body.contactId);
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body:
        'event: message\ndata: {"token":"Hi"}\n\n' +
        'event: followups\ndata: {"items":["Tell me more"]}\n\n' +
        'event: done\ndata: {}\n\n',
    });
  });

  await page.goto(`/ask?contactId=${id}`);
  const input = page.getByRole('textbox', { name: 'Ask anything' });
  await input.fill('what should I say?');
  await input.press('Enter');

  await expect(page.getByTestId('follow-up-chip').first()).toBeVisible();
  await page.getByTestId('follow-up-chip').first().click();

  // Wait for the second POST to land.
  await expect.poll(() => seenContactIds.length).toBe(2);
  expect(seenContactIds[1]).toBe(id);
});
