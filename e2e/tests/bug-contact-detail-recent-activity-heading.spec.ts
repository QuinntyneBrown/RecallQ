// Covers bug: docs/bugs/contact-detail-recent-activity-heading-typography.md
// Per docs/ui-design.pen u8iUA, the section heading is Geist 15/700
// with -0.2px tracking.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail Recent activity heading typography', async ({ page }) => {
  const email = `cdra-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const h2 = page.locator('.activity-head h2');
  await expect(h2).toBeVisible();

  const styles = await h2.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });

  expect(styles.fontSize).toBe('15px');
  expect(styles.letterSpacing).toBe('-0.2px');
});
