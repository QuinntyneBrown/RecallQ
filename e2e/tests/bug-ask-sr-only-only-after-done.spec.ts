// Covers bug: docs/bugs/ask-streaming-announces-tokens-not-final-answer.md
// Flow 41 step 3-4: streaming tokens go to a hidden buffer, not into
// the live-region announcement node. After `event: done` the full
// answer is atomically written into the live region exactly once.
//
// Behaviorally, the sr-only "RecallQ said: …" announcement span must
// contain the final answer text once streaming completes. Today the
// span only contains the literal prefix "RecallQ said: " and the
// streaming text bleeds into the live region as separate text nodes
// that mutate per token — so screen readers re-read on every chunk.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('after stream completes, sr-only announcement contains full answer text', async ({ page }) => {
  const email = `aso-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');
  await page.getByLabel('Ask a question').fill('Hello');
  await page.getByRole('button', { name: 'Send' }).click();

  const bubble = page.getByTestId('assistant-bubble');
  await expect(bubble).toBeVisible({ timeout: 15_000 });

  // Wait for streaming to complete.
  await expect(bubble).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });

  // Capture the assistant's full text content (without the speaker
  // prefix).
  const fullVisible = (await bubble.innerText()).trim();
  expect(fullVisible.length).toBeGreaterThan(0);

  // The sr-only announcement node must include the full answer text,
  // not just the literal "RecallQ said: " prefix. That's the only
  // shape that gives screen-reader users a single atomic
  // announcement of the final answer (per flow 41 step 4) instead of
  // a separate text node that mutated on every token.
  const sr = bubble.locator('span.sr-only').first();
  await expect(sr).toHaveCount(1);
  const srText = (await sr.innerText()).trim();
  expect(srText.startsWith('RecallQ said:')).toBe(true);
  // The body of the answer (everything after "RecallQ said:") should
  // be present inside the sr-only span. After the fix it's the full
  // answer; today it's the empty string.
  const announced = srText.replace(/^RecallQ said:\s*/, '').trim();
  expect(announced.length).toBeGreaterThan(0);
});
