// Traces to: L2-021, L2-022, L2-061, L2-084
// Task: T016
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { AskModePage } from '../pages/ask-mode.page';
import { screenshot } from '../fixtures/screenshot';

test('T016 ask mode streams tokens into assistant bubble', async ({ page }) => {
  const email = `t016-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const ask = new AskModePage(page);
  await ask.goto();

  await expect(ask.greetBubble()).toBeVisible();

  const q = 'who should I talk to about Series B?';
  await ask.type(q);
  await ask.send();

  await expect(ask.userBubbles().first()).toHaveText(q);

  const assistantBubble = ask.assistantBubbles().first();
  await expect(async () => {
    expect(await assistantBubble.innerText()).toMatch(/Based/);
  }).toPass({ timeout: 5000 });

  await expect(assistantBubble).toContainText('Based on your network', { timeout: 5000 });

  await screenshot(page, 'T016-ask');
});
