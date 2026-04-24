// Traces to: L2-029, L2-030
// Task: T021
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { HomePage } from '../pages/home.page';
import { screenshot } from '../fixtures/screenshot';

test('T021 proactive suggestion card appears, navigates, and dismisses', async ({ page }) => {
  test.setTimeout(90_000);
  const email = `t021-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const names = ['AI founder Alice', 'AI founder Bob', 'AI founder Carol'];
  const contactIds: string[] = [];
  for (const name of names) {
    const res = await page.request.post('/api/contacts', {
      data: {
        displayName: name, initials: 'AI', role: null, organization: null, location: null,
        tags: ['ai founders'], emails: [], phones: [],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    contactIds.push(body.id);
  }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  for (const id of contactIds) {
    const r = await page.request.post(`/api/contacts/${id}/interactions`, {
      data: { type: 'Meeting', occurredAt: twoDaysAgo, subject: 'Coffee', content: 'met' },
    });
    expect(r.status()).toBe(201);
  }

  // Trigger detector via admin endpoint
  const trig = await page.request.post('/api/admin/detect-suggestions');
  expect(trig.status()).toBe(200);

  const home = new HomePage(page);
  await home.goto();

  await expect(home.suggestionCard()).toBeVisible({ timeout: 10_000 });
  await expect(home.suggestionCard()).toContainText('ai founders');

  await screenshot(page, 'T021-suggestion');

  await home.tapSuggestionPrimary();
  await expect(page).toHaveURL(/\/search\?q=/);
  expect(decodeURIComponent(page.url())).toContain('ai founders');

  await home.goto();
  await expect(home.suggestionCard()).toBeVisible({ timeout: 10_000 });
  await home.tapSuggestionDismiss();
  await expect(home.suggestionCard()).toHaveCount(0);

  await home.goto();
  await expect(home.suggestionCard()).toHaveCount(0);
});
