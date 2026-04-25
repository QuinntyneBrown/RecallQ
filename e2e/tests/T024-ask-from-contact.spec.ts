// Traces to: L2-040
// Task: T024
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { AskModePage } from '../pages/ask-mode.page';
import { screenshot } from '../fixtures/screenshot';

async function createContactViaApi(
  page: import('@playwright/test').Page,
  payload: { displayName: string; initials: string },
): Promise<string> {
  const res = await page.request.post('/api/contacts', { data: payload });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.id as string;
}

function uniqueEmail() {
  return `t024-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test.describe('T024 ask from contact', () => {
  test('ask AI tile seeds input and sends edited question', async ({ page }) => {
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const id = await createContactViaApi(page, {
      displayName: 'Carol Contact',
      initials: 'CC',
    });

    const detail = new ContactDetailPage(page);
    await detail.goto(id);

    await page.getByRole('button', { name: 'Ask AI about this contact' }).click();

    await expect(page).toHaveURL(new RegExp(`/ask\\?contactId=${id}$`));

    const ask = new AskModePage(page);
    await expect.poll(async () => ask.seededInputValue()).toBe('What should I say to Carol Contact next?');

    const input = page.getByRole('textbox', { name: 'Ask a question' });
    await input.fill('Custom question instead');
    await ask.send();

    await expect(ask.userBubbles().filter({ hasText: 'Custom question instead' })).toBeVisible();
    await expect(ask.userBubbles().filter({ hasText: 'What should I say to Carol Contact next?' })).toHaveCount(0);

    await screenshot(page, 'T024-ask-from-contact');
  });
});
