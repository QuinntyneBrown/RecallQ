// Covers bug: docs/bugs/import-drop-zone-does-not-accept-drag-and-drop.md
// Flow 31 — the import drop-zone advertises drag-and-drop and must
// accept a dropped CSV file the same way clicking-and-choosing does.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('drop-zone accepts a dropped CSV and primes the upload button', async ({ page }) => {
  const email = `imp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/import');

  const dropZone = page.getByTestId('drop-zone');
  await expect(dropZone).toContainText('Drag CSV or click to choose');

  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    const file = new File(
      ['displayName,role\nAlice,CEO\n'],
      'contacts.csv',
      { type: 'text/csv' },
    );
    dt.items.add(file);
    return dt;
  });

  await dropZone.dispatchEvent('dragover', { dataTransfer });
  await dropZone.dispatchEvent('drop', { dataTransfer });

  await expect(dropZone).toContainText('contacts.csv');
  await expect(page.getByRole('button', { name: 'Upload' })).toBeEnabled();
});
