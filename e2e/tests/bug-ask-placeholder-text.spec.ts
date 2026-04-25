// Covers bug: docs/bugs/ask-input-placeholder-text-mismatches-design.md
// Per docs/ui-design.pen Yhnwp (inside tUHxK inputBar), the chat input
// placeholder reads "Ask about anyone..." — a contact-centric framing,
// not the generic "Ask anything" the implementation currently shows.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask input placeholder reads "Ask about anyone..."', async ({ page }) => {
  const email = `apt-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await expect(input).toBeVisible({ timeout: 10_000 });
  await expect(input).toHaveAttribute('placeholder', 'Ask about anyone...');
});
