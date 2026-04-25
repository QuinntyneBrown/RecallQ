// Covers bug: docs/bugs/timeline-item-pill-colors-mismatch.md
// Email pill should use cyan #4BE8FF (--accent-tertiary) per
// docs/ui-design.pen 7W2kN, not the implementation's purple
// --accent-primary.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('timeline email pill uses cyan, not purple', async ({ page }) => {
  const email = `tlpc-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  // Seed an email interaction so the timeline renders.
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

  const pill = page.locator('.pill[data-type="email"]').first();
  await expect(pill).toBeVisible({ timeout: 10_000 });

  const bg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Chromium serialises color-mix() as `color(srgb r g b / a)` with
  // 0..1 channels. Cyan #4BE8FF = rgb(75, 232, 255):
  //   75/255 ≈ 0.294, 232/255 ≈ 0.910, 255/255 = 1.
  expect(bg).toMatch(/0\.29\d+\s+0\.90\d+\s+1/);
});
