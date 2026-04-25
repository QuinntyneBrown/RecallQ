// Covers bug: docs/bugs/ask-input-aria-label-mismatches-flow-41.md
// Flow 41 step 1 specifies aria-label="Ask a question" on the chat
// input.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('ask chat input exposes aria-label "Ask a question"', async ({ page }) => {
  const email = `aql-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');

  await expect(page.getByRole('textbox', { name: 'Ask a question' })).toBeVisible();
});
