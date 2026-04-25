// Covers bug: docs/bugs/ask-new-session-leaves-draft-in-input.md
// Flow 22 — tapping "+" (new session) must return the chat to the
// greeting state end-to-end, including emptying the input bar.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask + button clears the input draft', async ({ page }) => {
  const email = `ans-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const input = page.getByRole('textbox', { name: 'Ask anything' });
  await input.fill('Tell me about Avery');
  await expect(input).toHaveValue('Tell me about Avery');

  await page.getByRole('button', { name: 'New session' }).click();

  await expect(input).toHaveValue('');
});
