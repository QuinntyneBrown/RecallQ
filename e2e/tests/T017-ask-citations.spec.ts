// Traces to: L2-023
// Task: T017
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AskModePage } from '../pages/ask-mode.page';
import { screenshot } from '../fixtures/screenshot';

test('T017 ask mode renders citation cards and navigates on click', async ({ page }) => {
  test.setTimeout(90_000);
  const email = `t017-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const seeds = ['foo investor Alice', 'foo engineer Bob', 'foo teacher Carol'];
  const results = await Promise.all(seeds.map(name =>
    page.request.post('/api/contacts', {
      data: {
        displayName: name, initials: 'FT', role: null, organization: null, location: null,
        tags: [], emails: [], phones: [],
      },
    }),
  ));
  for (const r of results) expect(r.status()).toBe(201);

  const deadline = Date.now() + 30_000;
  let matched = 0;
  while (Date.now() < deadline) {
    const res = await page.request.post('/api/search', { data: { q: 'foo' } });
    if (res.status() === 200) {
      const body = await res.json();
      matched = body.contactsMatched ?? 0;
      if (matched >= 3) break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  expect(matched).toBeGreaterThanOrEqual(3);

  const ask = new AskModePage(page);
  await ask.goto();
  await ask.type('who should I ask about foo?');
  await ask.send();

  const assistantBubble = ask.assistantBubbles().first();
  await expect(assistantBubble).toContainText('Based', { timeout: 5000 });

  await expect(ask.citations()).toHaveCount(3, { timeout: 5000 });

  await screenshot(page, 'T017-ask-citations');

  await ask.citations().first().click();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
});
