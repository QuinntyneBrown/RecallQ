// Traces to: L2-024
// Task: T018
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AskModePage } from '../pages/ask-mode.page';
import { screenshot } from '../fixtures/screenshot';

test('T018 follow-up chips render and tapping one submits as next question', async ({ page }) => {
  test.setTimeout(90_000);
  const email = `t018-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const ask = new AskModePage(page);
  await ask.goto();
  await ask.type('hello');
  await ask.send();

  const assistantBubble = ask.assistantBubbles().first();
  await expect(assistantBubble).toContainText('Based', { timeout: 5000 });

  await expect(ask.followUps()).toHaveCount(3, { timeout: 5000 });

  await screenshot(page, 'T018-followups');

  const secondChipText = (await ask.followUps().nth(1).textContent())?.trim() ?? '';
  expect(secondChipText.length).toBeGreaterThan(0);

  await ask.tapFollowUp(1);

  await expect(ask.userBubbles().filter({ hasText: secondChipText })).toHaveCount(1, { timeout: 5000 });
});
