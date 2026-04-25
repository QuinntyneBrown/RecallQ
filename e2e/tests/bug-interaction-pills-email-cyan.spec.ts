// Covers bug: docs/bugs/interaction-pills-email-note-colors-swapped.md
// Email pill in app-interaction-pills should tint cyan, not purple.
// Test renders a contact with email interactions and checks the
// shared interaction-pill on the result-card.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('interaction-pills email tint is cyan, not purple', async ({ page }) => {
  const email = `iplc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  const ix = await page.request.post(`/api/contacts/${contact.id}/interactions`, {
    data: {
      type: 'email',
      subject: 'Hello',
      content: 'How are you?',
      occurredAt: new Date().toISOString(),
    },
  });
  expect(ix.ok()).toBe(true);

  await page.goto('/search?q=Sarah');

  const pill = page.locator('app-interaction-pills .pill[data-type="email"]').first();
  await expect(pill).toBeVisible({ timeout: 10_000 });

  const bg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Cyan #4BE8FF channels — Chromium serialises color-mix as
  // `color(srgb 0.294 0.910 1 / 0.25)`.
  expect(bg).toMatch(/(75,\s*232,\s*255|0\.29\d+\s+0\.90\d+\s+1)/);
});
