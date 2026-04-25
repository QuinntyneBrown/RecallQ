// Covers bug: docs/bugs/relationship-summary-card-background-mismatch.md
// Per docs/ui-design.pen GwZQR aiSummary, the card fills with
// --surface-secondary (#141425, rgb(20,20,37)).
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('relationship summary card uses --surface-secondary background', async ({ page }) => {
  const email = `rscb-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const card = page.locator('.ai-card').first();
  await expect(card).toBeVisible();

  const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
  // --surface-secondary = #141425 -> rgb(20, 20, 37)
  expect(bg).toBe('rgb(20, 20, 37)');
});
