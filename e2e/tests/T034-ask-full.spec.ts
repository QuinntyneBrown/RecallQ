// Traces to: L2-021, L2-022, L2-023, L2-024, L2-025
// Task: T034
import { test, expect } from '@playwright/test';
import { registerFlow } from '../flows/register.flow';
import { api } from '../flows/api';
import { AskModePage } from '../pages/ask-mode.page';
import { screenshot } from '../fixtures/screenshot';

test('T034 ask full experience: stream + citations + follow-ups + retention + tap', async ({ page }) => {
  test.setTimeout(120_000);

  const ts = Date.now();
  await registerFlow(page, `alice+${ts}@example.com`, 'correcthorseb4ttery');

  const a = api(page);

  const seeds = [
    { displayName: 'Sarah Mitchell', initials: 'SM', role: 'VP Product', organization: 'Stripe', tags: ['Investor', 'Series B'] },
    { displayName: 'Alex Chen',      initials: 'AC', role: 'CTO',        organization: 'Anthropic', tags: ['AI'] },
    { displayName: 'Marcus Reyes',   initials: 'MR', role: 'Partner',    organization: 'Sequoia',   tags: ['Investor'] },
  ];
  for (const s of seeds) {
    const created = await a.addContact({ ...s, location: null, emails: [], phones: [] });
    expect(created).not.toBeNull();
  }

  await expect.poll(
    async () => (await a.search('investor')).results.length,
    { timeout: 30_000 },
  ).toBeGreaterThan(0);

  const ask = new AskModePage(page);
  await ask.goto();
  await expect(ask.greetBubble()).toBeVisible();

  await ask.type('who should I talk to about a Series B?');
  await ask.send();

  // Stream observation — capture growth over time
  let lastLen = 0;
  let grew = false;
  await expect.poll(async () => {
    const text = (await ask.assistantBubbles().last().innerText()).trim();
    if (text.length > lastLen) grew = true;
    lastLen = text.length;
    return text;
  }, { timeout: 10_000 }).toContain('Based on your network');
  expect(grew).toBe(true);

  await expect(ask.citations()).toHaveCount(3);
  await expect(ask.followUps()).toHaveCount(3);

  await screenshot(page, 'T034-ask');

  // Citation round-trip
  const href = await ask.citations().first().getAttribute('href');
  expect(href).toMatch(/\/contacts\/[0-9a-f-]+$/);
  await ask.citations().first().click();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/ask$/);

  await expect(ask.userBubbles()).toHaveCount(1);
  await expect(ask.assistantBubbles()).toHaveCount(1);
  await expect(ask.citations()).toHaveCount(3);
  await expect(ask.followUps()).toHaveCount(3);

  // Follow-up tap
  const chip2Text = await ask.followUps().nth(1).innerText();
  await ask.tapFollowUp(1);

  await expect(ask.userBubbles()).toHaveCount(2);
  await expect(ask.userBubbles().last()).toHaveText(chip2Text);

  await expect.poll(
    async () => (await ask.assistantBubbles().last().innerText()).trim(),
    { timeout: 10_000 },
  ).toContain('Based on your network');

  await screenshot(page, 'T034-ask-2');
});
