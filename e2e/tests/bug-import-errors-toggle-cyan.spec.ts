// Covers bug: docs/bugs/import-errors-toggle-purple-not-cyan.md
// Mock /api/import/contacts so the result has errors, upload a tiny
// CSV, then assert .errors-toggle paints --accent-tertiary cyan.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

test('import errors-toggle is cyan, not purple', async ({ page }) => {
  const email = `iert-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/import/contacts', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        imported: 1,
        failed: 1,
        errors: [{ row: 2, reason: 'displayName required' }],
      }),
    });
  });

  await page.goto('/import');

  // Write a throwaway CSV and upload it.
  const csvPath = path.join(os.tmpdir(), `loop-import-${Date.now()}.csv`);
  fs.writeFileSync(csvPath, 'displayName,initials\nSarah Mitchell,SM\n', 'utf8');
  await page.locator('input[type="file"]').setInputFiles(csvPath);
  await page.getByRole('button', { name: 'Upload' }).click();

  const toggle = page.locator('.errors-toggle');
  await expect(toggle).toBeVisible({ timeout: 5_000 });

  const color = await toggle.evaluate((el) => getComputedStyle(el).color);
  // --accent-tertiary = #4BE8FF -> rgb(75, 232, 255)
  expect(color).toBe('rgb(75, 232, 255)');
});
