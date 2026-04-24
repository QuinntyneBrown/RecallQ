// Traces to: L2-010, L2-011, L2-031, L2-033
// Task: T033
import { test, expect } from '@playwright/test';
import { registerFlow } from '../flows/register.flow';
import { logInteractionFlow } from '../flows/log-interaction.flow';
import { api } from '../flows/api';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { screenshot } from '../fixtures/screenshot';

test('T033 log interaction triggers summary refresh loop', async ({ page }) => {
  test.setTimeout(120_000);

  const email = `alice+${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerFlow(page, email, 'correcthorseb4ttery');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    role: 'VP Product',
    organization: 'Stripe',
    tags: ['Investor', 'Series B'],
  });
  expect(contact).toBeTruthy();
  const contactId: string = contact.id;

  const seedRes = await page.request.post(`/api/contacts/${contactId}/interactions`, {
    data: {
      type: 'email',
      occurredAt: new Date().toISOString(),
      subject: 'Initial',
      content: 'First contact message.',
    },
  });
  expect(seedRes.status()).toBe(201);

  const detail = new ContactDetailPage(page);
  await detail.goto(contactId);

  await expect(detail.summaryParagraph()).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => await detail.statInteractions().innerText(), { timeout: 30_000 })
    .toMatch(/1\b/);

  await screenshot(page, 'T033-1-before');

  await logInteractionFlow(page, contactId, {
    type: 'call',
    content: 'Zanzibar checkpoint call with Sarah to align on Q3 roadmap.',
  });

  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  await expect
    .poll(async () => await detail.statInteractions().innerText(), { timeout: 30_000 })
    .toMatch(/2\b/);

  await expect
    .poll(async () => await detail.statSinceLast().innerText(), { timeout: 30_000 })
    .toMatch(/just now|0\s*h|0\s*d|today|<\s*1\s*hour/i);

  await screenshot(page, 'T033-2-after');
});
