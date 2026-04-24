// Traces to: L2-026, L2-027, L2-028, L2-056
// Task: T020
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { HomePage } from '../pages/home.page';
import { screenshot } from '../fixtures/screenshot';

test('T020 smart stacks row appears with counts and navigates to search on tap', async ({ page }) => {
  const email = `t020-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await createContact(page, { displayName: 'AI founders investor A', initials: 'AA', tags: ['investor'] });
  await createContact(page, { displayName: 'AI founders builder B',  initials: 'AB', tags: ['investor'] });
  await createContact(page, { displayName: 'Close friends from uni', initials: 'CF' });

  const home = new HomePage(page);
  await home.goto();

  await expect(home.stackCards().first()).toBeVisible({ timeout: 10_000 });
  const count = await home.stackCards().count();
  expect(count).toBeGreaterThanOrEqual(2);

  for (let i = 0; i < count; i++) {
    const card = home.stackCards().nth(i);
    const txt = (await card.innerText()).trim();
    expect(txt.length).toBeGreaterThan(0);
    expect(txt).toMatch(/\d/);
  }

  await screenshot(page, 'T020-stacks');

  await home.tapStack('AI founders');
  await expect(page).toHaveURL(/\/search\?/);
  expect(page.url()).toContain('stackId=');
  await expect(page.getByTestId('stack-chip')).toContainText('AI founders');
});
