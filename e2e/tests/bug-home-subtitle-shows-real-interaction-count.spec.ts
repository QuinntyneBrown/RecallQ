// Covers bug: docs/bugs/contacts-count-endpoint-hardcodes-zero-interactions.md
// Home subtitle must reflect the actual interaction count for the
// authenticated user.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('home subtitle shows the real interaction count', async ({ page }) => {
  const email = `hsi-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contactId = await createContact(page, { displayName: 'Counter Person', initials: 'CP' });

  const ok = await page.evaluate(async (id) => {
    const res = await fetch(`/api/contacts/${id}/interactions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'note',
        occurredAt: new Date().toISOString(),
        subject: 'Counted',
        content: 'should bump count',
      }),
    });
    return res.status;
  }, contactId);
  expect(ok).toBe(201);

  await page.goto('/home');

  const subtitle = page.getByTestId('hero-subtitle');
  await expect(subtitle).toContainText('1 interaction');
  await expect(subtitle).not.toContainText('0 interactions');
});
