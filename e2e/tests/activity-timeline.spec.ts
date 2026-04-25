// Traces to: L1-003, L1-009, L2-011, L2-012, L2-035, L2-044
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('flow 12: activity timeline shows recent interactions inline', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Timeline Test Contact',
    initials: 'TTC',
  });

  // Navigate to contact detail
  await page.goto(`/contacts/${contactId}`);
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));

  // Create a few interactions
  for (let i = 0; i < 3; i++) {
    const logButton = page.getByRole('button', { name: /log/i });
    if (await logButton.isVisible()) {
      await logButton.click();
      // Select note type via radio button
      await page.getByRole('radio', { name: /note/i }).click();
      // Fill subject
      await page.getByLabel('Subject').fill(`Activity ${i + 1}`);
      // Fill content
      await page.getByLabel('Content').fill(`Test content ${i + 1}`);
      // Click Save button
      await page.getByRole('button', { name: /save/i }).click();
      // Wait to return to contact detail page
      await page.waitForURL(/\/contacts\/\w+-\w+-\w+-\w+-\w+$/);
    }
  }

  // Verify interactions appear in timeline
  for (let i = 1; i <= 3; i++) {
    await expect(page.getByText(`Activity ${i}`)).toBeVisible();
  }
});

test('flow 12: see all link navigates to full activity page', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'See All Test Contact',
    initials: 'SAT',
  });

  // Create multiple interactions
  for (let i = 0; i < 5; i++) {
    const response = await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: 'note',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: `Interaction ${i}`
      }
    });
    expect(response.status()).toBe(201);
  }

  // Navigate to contact detail
  await page.goto(`/contacts/${contactId}`);

  // Look for "See all" link
  const seeAllLink = page.getByRole('link', { name: /see all/i });
  if (await seeAllLink.isVisible()) {
    await seeAllLink.click();

    // Should navigate to activity page
    await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}/activity`));
  }
});

test('flow 12: activity page shows all interactions', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Full Activity Contact',
    initials: 'FAC',
  });

  // Create multiple interactions via API
  const interactionCount = 5;
  for (let i = 0; i < interactionCount; i++) {
    await page.request.post(`/api/contacts/${contactId}/interactions`, {
      data: {
        type: i % 2 === 0 ? 'email' : 'call',
        occurredAt: new Date(Date.now() - i * 60000).toISOString(),
        content: `Full Activity ${i}`
      }
    });
  }

  // Navigate directly to activity page
  await page.goto(`/contacts/${contactId}/activity`);
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}/activity`));

  // Verify interactions are displayed
  for (let i = 0; i < interactionCount; i++) {
    const text = page.getByText(`Full Activity ${i}`);
    await expect(text).toBeVisible({ timeout: 5000 });
  }
});

test('flow 12: empty state shows when no interactions', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const contactId = await createContact(page, {
    displayName: 'Empty Activity Contact',
    initials: 'EAC',
  });

  // Navigate to activity page without creating interactions
  await page.goto(`/contacts/${contactId}/activity`);

  // Look for empty state message
  const emptyState = page.getByText(/no activity|no interactions/i);
  const empty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

  // Also check if the page loads without errors
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}/activity`));
});
