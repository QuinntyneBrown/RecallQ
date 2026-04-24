// Traces to: L2-047, L2-048, L2-049, L2-050, L2-081
// Task: T003
import { test, expect } from '@playwright/test';
import { AppShellPage } from '../pages/app-shell.page';
import { screenshot } from '../fixtures/screenshot';

test('mobile shell renders status bar, bottom nav, home indicator', async ({ page }) => {
  const shell = new AppShellPage(page);
  await shell.goto();

  const frame = shell.mobileFrame();
  await expect(frame.statusBar).toBeVisible();
  await expect(frame.bottomNav).toBeVisible();
  await expect(frame.homeIndicator).toBeVisible();

  await screenshot(page, 'T003-shell');
});
