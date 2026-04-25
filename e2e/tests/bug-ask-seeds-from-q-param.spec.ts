// Covers bug: docs/bugs/ask-page-ignores-q-query-param.md
// /ask must seed the draft input from ?q=<text> so the search
// zero-state handoff (Flow 18) actually carries the query.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('/ask?q=<text> seeds the draft input', async ({ page }) => {
  const email = `askq-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const seed = 'investors who liked AI tools';
  await page.goto(`/ask?q=${encodeURIComponent(seed)}`);

  const input = page.getByRole('textbox', { name: 'Ask anything' });
  await expect(input).toHaveValue(seed);
});
