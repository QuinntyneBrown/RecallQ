// Traces to: L2-006, L2-011, L2-034, L2-035, L2-036, L2-083
// Task: T010
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { screenshot } from '../fixtures/screenshot';

test('T010 contact detail shows hero, timeline and star toggle', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Sarah Mitchell',
    initials: 'SM',
    role: 'VP Product',
    organization: 'Stripe',
    tags: ['Investor', 'Series B', 'SF Bay'],
  });

  const now = Date.now();
  const day = 86400000;
  const seeds = [
    { type: 'email',   occurredAt: new Date(now -  1 * day).toISOString(), subject: 'Intro ping', content: 'Hi Sarah' },
    { type: 'call',    occurredAt: new Date(now -  3 * day).toISOString(), subject: 'Call back',  content: 'Call' },
    { type: 'meeting', occurredAt: new Date(now -  5 * day).toISOString(), subject: 'Coffee',     content: 'Met' },
    { type: 'note',    occurredAt: new Date(now -  7 * day).toISOString(), subject: 'Follow-up',  content: 'Note' },
    { type: 'email',   occurredAt: new Date(now - 10 * day).toISOString(), subject: 'Kickoff',    content: 'Start' },
  ];
  for (const s of seeds) {
    const res = await page.request.post(`/api/contacts/${contactId}/interactions`, { data: s });
    expect(res.status()).toBe(201);
  }

  const pom = new ContactDetailPage(page);
  await pom.goto(contactId);

  await expect(pom.heroName()).toHaveText('Sarah Mitchell');
  const roleText = await pom.heroRole().textContent();
  expect(roleText).toContain('VP Product');
  expect(roleText).toContain('Stripe');
  expect(await pom.tags().count()).toBeGreaterThanOrEqual(3);
  await expect(pom.timelineItems()).toHaveCount(3);
  await expect(pom.seeAllLink()).toBeVisible();
  await expect(pom.seeAllLink()).toHaveText(/See all 5/);

  await pom.starButton().click();
  const starIcon = pom.starButton().locator('i');
  await expect(starIcon).toHaveClass(/ph-star-fill/);

  await screenshot(page, 'T010-contact-detail');
});
