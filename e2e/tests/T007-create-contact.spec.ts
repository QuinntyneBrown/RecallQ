// Traces to: L2-005, L2-056, L2-076
// Task: T007
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AddContactPage } from '../pages/add-contact.page';
import { screenshot } from '../fixtures/screenshot';

test('create contact navigates to detail page', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const pom = new AddContactPage(page);
  await pom.goto();
  await pom.fill({
    displayName: 'Alice Example',
    initials: 'AE',
    role: 'Investor',
    organization: 'ACME Capital',
    tags: ['vc', 'portfolio'],
    emails: ['alice@acme.com'],
  });

  await screenshot(page, 'T007-add-contact');

  await pom.save();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/, { timeout: 20_000 });
});
