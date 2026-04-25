// Covers bug: docs/bugs/timeline-item-delete-hover-not-red.md
// The .del:hover state should paint #FF6B6B red, matching the design's
// destructive language, not --accent-secondary brand magenta.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('timeline delete button hover paints red', async ({ page }) => {
  const email = `tldh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

  await page.goto(`/contacts/${contact.id}`);

  const del = page.getByRole('button', { name: 'Delete interaction' }).first();
  await expect(del).toBeVisible({ timeout: 10_000 });
  await del.hover();

  const color = await del.evaluate((el) => getComputedStyle(el).color);
  // #FF6B6B = rgb(255, 107, 107)
  expect(color).toBe('rgb(255, 107, 107)');
});
