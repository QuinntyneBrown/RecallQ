// Traces to: L2-077
// Task: T025
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { registerAndLogin } from '../flows/register.flow';
import { ImportPage } from '../pages/import.page';
import { screenshot } from '../fixtures/screenshot';

test('import csv: 4 imported, 1 failed, errors expand, embeddings searchable', async ({ page }) => {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'correcthorse12';
  await registerAndLogin(page, email, password);

  const pom = new ImportPage(page);
  await pom.goto();
  await pom.uploadFile(path.resolve(__dirname, '../fixtures/sample-contacts.csv'));
  await pom.submit();

  await expect(pom.importedCount()).toContainText('4 imported');
  await expect(pom.failedCount()).toContainText('1 failed');

  await pom.expandErrors();
  const list = page.locator('ul.errors-list');
  await expect(list).toContainText(/Row 3|Row 4/);
  await expect(list).toContainText(/displayName/);

  await screenshot(page, 'T025-import');

  // Poll search until "Alice Example" shows up via embeddings.
  const deadline = Date.now() + 30_000;
  let found = false;
  while (Date.now() < deadline) {
    const res = await page.request.post('/api/search', {
      data: { q: 'Alice Example' },
    });
    if (res.ok()) {
      const body = await res.json();
      const items = body.results ?? body.items ?? [];
      if (Array.isArray(items) && items.some((i: { matchedText?: string; displayName?: string }) =>
        (i.matchedText ?? '').includes('Alice Example') || i.displayName === 'Alice Example')) {
        found = true;
        break;
      }
    }
    await page.waitForTimeout(500);
  }
  expect(found).toBe(true);
});
