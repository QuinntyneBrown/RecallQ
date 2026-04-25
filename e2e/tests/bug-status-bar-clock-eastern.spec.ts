// Covers bug: docs/bugs/status-bar-clock-hardcoded-941.md
// The status bar clock is mobile shell chrome, so the assertion goes
// through AppShellPage rather than selecting the component directly.
import { test, expect } from '@playwright/test';
import { AppShellPage } from '../pages/app-shell.page';

test.use({ timezoneId: 'UTC' });

test('status bar clock shows the Eastern app start time', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-04-25T00:05:00.000Z'));

  const shell = new AppShellPage(page);
  await shell.goto();

  await expect(shell.statusClock()).toHaveText('8:05');
});
