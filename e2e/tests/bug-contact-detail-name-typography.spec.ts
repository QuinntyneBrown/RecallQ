// Covers bug: docs/bugs/contact-detail-name-typography-mismatch.md
// Per docs/ui-design.pen wOANK → zdpNl, the hero name is Geist 24/700
// with -0.5px tracking.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('contact-detail name h1 typography matches design', async ({ page }) => {
  const email = `cdnt-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Seed one contact via the authenticated API session.
  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);

  const h1 = page.locator('.hero h1, .page h1').first();
  await expect(h1).toBeVisible();

  const styles = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, letterSpacing: cs.letterSpacing };
  });

  expect(styles.fontSize).toBe('24px');
  expect(styles.letterSpacing).toBe('-0.5px');
});
