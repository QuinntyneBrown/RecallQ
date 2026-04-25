// Covers bug: docs/bugs/result-card-avatar-too-large.md
// Per docs/ui-design.pen 6awDa, the result-card avatar is 44x44.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('result-card avatar is 44x44', async ({ page }) => {
  const email = `rcav-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await api(page).addContact({ displayName: 'Sarah Mitchell', initials: 'SM' });
  await api(page).addContact({ displayName: 'Alex Chen', initials: 'AC' });

  await page.goto('/search?q=Sarah');

  const avatar = page.locator('[data-testid="result-card"] .avatar').first();
  await expect(avatar).toBeVisible({ timeout: 10_000 });

  const styles = await avatar.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.width, height: cs.height };
  });

  expect(styles.width).toBe('44px');
  expect(styles.height).toBe('44px');
});
