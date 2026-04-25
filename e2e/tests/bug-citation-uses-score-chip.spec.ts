// Covers bug: docs/bugs/citation-card-does-not-use-score-chip.md
// Per Flow 20 step 4, the citation mini-cards must render the
// tiered Score chip rather than a raw similarity number.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('citation card renders a Score chip with the tier class', async ({ page }) => {
  const email = `cit-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body:
        'data: {"token":"Hi"}\n\n' +
        'event: citations\ndata: {"items":[{"contactId":"00000000-0000-0000-0000-000000000001","contactName":"Top Match","snippet":"strong fit","similarity":0.92,"source":"contact"}]}\n\n' +
        'event: done\ndata: {}\n\n',
    }),
  );

  await page.goto('/ask');
  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await input.fill('who matches?');
  await input.press('Enter');

  const citation = page.getByTestId('citation-card');
  await expect(citation).toBeVisible();
  // ScoreChipComponent emits a span with the tier class.
  await expect(citation.locator('.chip.high')).toBeVisible();
});
