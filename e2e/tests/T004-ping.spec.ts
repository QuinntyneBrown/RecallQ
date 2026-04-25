// Traces to: L2-072
// Task: T004
import { test, expect } from '@playwright/test';
import { AppShellPage } from '../pages/app-shell.page';
import { screenshot } from '../fixtures/screenshot';
import { registerAndLogin } from '../flows/register.flow';

test('app reports online when API is healthy', async ({ page }) => {
  const email = `ping-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const shell = new AppShellPage(page);
  await expect.poll(() => shell.isOnline(), { timeout: 15_000 }).toBe(true);
  await screenshot(page, 'T004-online');
});
