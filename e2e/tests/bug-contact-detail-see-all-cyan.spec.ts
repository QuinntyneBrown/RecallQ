// Covers bug: docs/bugs/contact-detail-see-all-link-purple-not-cyan.md
// The "See all N" link only renders when interactionTotal > 3, so the
// test seeds four interactions before navigating.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail See all link is cyan 12/500', async ({ page }) => {
  const email = `cdsa-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  for (let i = 0; i < 4; i++) {
    const ix = await page.request.post(
      `/api/contacts/${contact.id}/interactions`,
      {
        data: {
          type: 'email',
          subject: `Email ${i}`,
          content: 'body',
          occurredAt: new Date(Date.now() - i * 60_000).toISOString(),
        },
      },
    );
    expect(ix.ok()).toBe(true);
  }

  await page.goto(`/contacts/${contact.id}`);

  const link = page.locator('.activity-head a', { hasText: 'See all' });
  await expect(link).toBeVisible({ timeout: 10_000 });

  const styles = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight };
  });

  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(styles.color).toBe('rgb(75, 232, 255)');
  expect(styles.fontSize).toBe('12px');
  expect(styles.fontWeight).toBe('500');
});
