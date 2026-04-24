// Traces to: L2-010, L2-012, L2-013, L2-056
// Task: T009
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { AddInteractionPage } from '../pages/add-interaction.page';
import { screenshot } from '../fixtures/screenshot';

test('log interaction returns to contact detail', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Alice Example',
    initials: 'AE',
  });

  const pom = new AddInteractionPage(page);
  await pom.goto(contactId);
  await pom.selectType('call');
  await pom.setContent('Quick check-in today, covered roadmap and follow-up items.');

  await screenshot(page, 'T009-log-interaction');

  await pom.save();
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));
});
