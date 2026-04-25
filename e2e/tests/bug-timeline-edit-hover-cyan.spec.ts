// Covers bug: docs/bugs/timeline-item-edit-hover-not-cyan.md
// .edit:hover should paint --accent-tertiary cyan, matching the
// project's interactive accent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('timeline edit button hover paints cyan', async ({ page }) => {
  const email = `tleh-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
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

  const edit = page.getByRole('button', { name: 'Edit interaction' }).first();
  await expect(edit).toBeVisible({ timeout: 10_000 });
  await edit.hover();

  const color = await edit.evaluate((el) => getComputedStyle(el).color);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
