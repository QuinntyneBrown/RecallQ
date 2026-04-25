// Covers bug: docs/bugs/add-contact-tag-input-focus-purple-not-cyan.md
// Mirrors prior focus-state fixes: the .tag-label input on
// /contacts/new should paint --accent-tertiary cyan, not
// --accent-primary purple, on focus.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('add-contact tag input focus border is cyan', async ({ page }) => {
  const email = `acti-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/contacts/new');

  const tagInput = page.locator('.tag-label input');
  await expect(tagInput).toBeVisible();
  await tagInput.focus();

  const styles = await tagInput.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { borderColor: cs.borderColor, boxShadow: cs.boxShadow };
  });

  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(styles.borderColor).toBe('rgb(75, 232, 255)');
  expect(styles.boxShadow).toContain('rgb(75, 232, 255)');
});
