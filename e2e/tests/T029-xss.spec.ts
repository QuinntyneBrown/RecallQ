// Traces to: L2-053
// Task: T029
import { test, expect, Dialog } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { screenshot } from '../fixtures/screenshot';

test('T029 XSS payload persists raw and renders escaped', async ({ page }) => {
  const email = `t029-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const payload = '<script>alert(1)</script>';
  const imgPayload = '<img src=x onerror=alert(2)>';

  const res = await page.request.post('/api/contacts', {
    data: {
      displayName: payload,
      initials: 'XS',
      role: null,
      organization: null,
      location: null,
      tags: [imgPayload],
      emails: [],
      phones: [],
    },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  const contactId = body.id as string;
  expect(body.displayName).toBe(payload);

  const dialogs: Dialog[] = [];
  page.on('dialog', (d) => {
    dialogs.push(d);
    d.dismiss().catch(() => {});
  });

  const pom = new ContactDetailPage(page);
  await pom.goto(contactId);
  await expect(pom.heroName()).toBeVisible();

  await page.waitForTimeout(1000);
  expect(dialogs.length).toBe(0);

  await expect(pom.heroName()).toContainText('<script>alert(1)</script>');

  await screenshot(page, 'T029-xss-safe');
});
