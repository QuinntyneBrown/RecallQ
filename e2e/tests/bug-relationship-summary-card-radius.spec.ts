// Covers bug: docs/bugs/relationship-summary-card-radius-too-large.md
// Per docs/ui-design.pen GwZQR aiSummary, cornerRadius is 18.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('relationship summary card border-radius is 18px', async ({ page }) => {
  const email = `rscr-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const card = page.locator('.ai-card').first();
  await expect(card).toBeVisible();

  const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe('18px');
});
