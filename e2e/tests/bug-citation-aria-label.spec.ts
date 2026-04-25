// Covers bug: docs/bugs/citation-card-missing-aria-label.md
// Per Flow 41 step 5, citation cards must expose an accessible
// name shaped like 'Contact: <name>, similarity <score>'.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('citation card carries a Contact: aria-label', async ({ page }) => {
  const email = `cit-aria-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body:
        'data: {"token":"Hi"}\n\n' +
        'event: citations\ndata: {"items":[{"contactId":"00000000-0000-0000-0000-0000000000aa","contactName":"Sarah Mitchell","snippet":"Series B fit","similarity":0.91,"source":"contact"}]}\n\n' +
        'event: done\ndata: {}\n\n',
    }),
  );

  await page.goto('/ask');
  const input = page.getByRole('textbox', { name: 'Ask anything' });
  await input.fill('who matches?');
  await input.press('Enter');

  const citation = page.getByTestId('citation-card');
  await expect(citation).toBeVisible();
  await expect(citation).toHaveAttribute('aria-label', /^Contact: Sarah Mitchell, similarity 0\.91$/);
});
