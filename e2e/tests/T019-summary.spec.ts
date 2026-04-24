// Traces to: L2-031, L2-032, L2-033
// Task: T019
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { screenshot } from '../fixtures/screenshot';

test('T019 relationship summary card renders paragraph, stats, and sentiment', async ({ page }) => {
  test.setTimeout(90_000);
  const email = `t019-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contactId = await createContact(page, {
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    role: 'VP Product',
    organization: 'Stripe',
    tags: ['Investor'],
  });

  const now = Date.now();
  const day = 86_400_000;
  const seeds = [
    { type: 'email',   occurredAt: new Date(now -  1 * day).toISOString(), subject: 'Ping',   content: 'Hi Sarah checking in' },
    { type: 'call',    occurredAt: new Date(now -  2 * day).toISOString(), subject: 'Call',   content: 'Discussed roadmap' },
    { type: 'meeting', occurredAt: new Date(now -  3 * day).toISOString(), subject: 'Coffee', content: 'Great chat about product' },
  ];
  for (const s of seeds) {
    const res = await page.request.post(`/api/contacts/${contactId}/interactions`, { data: s });
    expect(res.status()).toBe(201);
  }

  const pom = new ContactDetailPage(page);
  await pom.goto(contactId);

  await expect(pom.summaryParagraph()).toBeVisible({ timeout: 30_000 });
  await expect(pom.statInteractions()).toContainText('3');
  await expect(pom.statSentiment()).toHaveText(/Warm|Neutral|Cool/);
  await expect(pom.statSinceLast()).toBeVisible();

  await screenshot(page, 'T019-summary');
});
