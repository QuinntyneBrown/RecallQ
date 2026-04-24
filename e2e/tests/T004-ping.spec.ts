// Traces to: L2-072
// Task: T004
import { test, expect } from '@playwright/test';
import { AppShellPage } from '../pages/app-shell.page';
import { screenshot } from '../fixtures/screenshot';

test('app reports online when API is healthy', async ({ page }) => {
  const shell = new AppShellPage(page);
  await shell.goto();
  await expect.poll(() => shell.isOnline(), { timeout: 15_000 }).toBe(true);
  await screenshot(page, 'T004-online');
});
