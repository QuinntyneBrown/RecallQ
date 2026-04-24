// Traces to: (harness)
// Task: T002
import { test } from '@playwright/test';
import { AppShellPage } from '../pages/app-shell.page';
import { screenshot } from '../fixtures/screenshot';

test('app shell loads at XS', async ({ page }) => {
  const shell = new AppShellPage(page);
  await shell.goto();
  await screenshot(page, 'T002-harness');
});
