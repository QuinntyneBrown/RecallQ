// Covers bug: docs/bugs/contact-detail-avatar-initials-too-small.md
// Per docs/ui-design.pen dQyTw, the hero avatar initials are Geist
// 36/700 with -1px tracking.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail avatar initials are 36/-1', async ({ page }) => {
  const email = `cdai-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const avatar = page.locator('.avatar').first();
  await expect(avatar).toBeVisible();

  const styles = await avatar.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });

  expect(styles.fontSize).toBe('36px');
  expect(styles.letterSpacing).toBe('-1px');
});
