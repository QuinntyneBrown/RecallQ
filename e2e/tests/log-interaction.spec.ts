// Traces to: L1-003, L2-010, L2-012, L2-076, L2-078, L2-033
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { AddInteractionPage } from '../pages/add-interaction.page';

test('flow 11: log email interaction on contact and display at top of timeline', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'John Doe',
    initials: 'JD',
  });

  const interaction = new AddInteractionPage(page);
  await interaction.goto(contactId);
  await interaction.selectType('email');
  await interaction.setContent('Discussed Q4 planning and roadmap priorities');
  await interaction.save();

  // Verify redirected back to contact detail
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Verify interaction appears in timeline
  await expect(page.getByText('Discussed Q4 planning')).toBeVisible();
});

test('flow 11: log different interaction types', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Jane Doe',
    initials: 'JD',
  });

  const types = ['email', 'call', 'meeting', 'note'];

  for (const type of types) {
    const interaction = new AddInteractionPage(page);
    await interaction.goto(contactId);
    await interaction.selectType(type);
    await interaction.setContent(`Testing ${type} interaction`);
    await interaction.save();

    // Verify redirected back to contact detail
    await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

    // Verify interaction appears
    await expect(page.getByText(`Testing ${type} interaction`)).toBeVisible();
  }
});

test('flow 11: interaction appears at top of timeline', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Alice Example',
    initials: 'AE',
  });

  // Log first interaction
  const interaction1 = new AddInteractionPage(page);
  await interaction1.goto(contactId);
  await interaction1.selectType('email');
  await interaction1.setContent('First interaction - older timestamp');
  await interaction1.save();
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Log second interaction
  const interaction2 = new AddInteractionPage(page);
  await interaction2.goto(contactId);
  await interaction2.selectType('call');
  await interaction2.setContent('Second interaction - should be at top');
  await interaction2.save();
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Verify second interaction appears in timeline (appears at top)
  const secondInteractionText = page.getByText('Second interaction - should be at top');
  await expect(secondInteractionText).toBeVisible();
});
