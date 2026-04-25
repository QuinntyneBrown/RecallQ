// Covers bug: docs/bugs/call-tile-uses-user-agent-not-viewport.md
// At a mobile viewport, the Call tile must launch tel:<phone>
// regardless of User-Agent.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';

test('Call tile launches tel: at the XS viewport', async ({ page }) => {
  const email = `tel-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const id = await createContact(page, {
    displayName: 'Phone Person',
    initials: 'PP',
    phones: ['+15551234'],
  });

  await page.goto(`/contacts/${id}`);
  await page.evaluate(() => {
    const w = window as unknown as { __rqNav?: (h: string) => boolean; __capturedHref?: string };
    w.__capturedHref = '';
    w.__rqNav = (href: string) => { w.__capturedHref = href; return true; };
  });

  await page.getByRole('button', { name: 'Call this contact' }).click();

  const captured = await page.evaluate(
    () => (window as unknown as { __capturedHref?: string }).__capturedHref ?? '',
  );
  expect(captured).toMatch(/^tel:/);
});
