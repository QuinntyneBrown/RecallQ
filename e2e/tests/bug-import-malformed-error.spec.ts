// Covers bug: docs/bugs/import-malformed-file-shows-raw-status-error.md
// A 400 Bad Request from the import endpoint must surface a
// descriptive error, not the internal 'import_failed_400' string.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('import shows friendly copy when the server returns 400', async ({ page }) => {
  const email = `imp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.route('**/api/import/contacts', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/import');
  await page.getByLabel('CSV file').setInputFiles({
    name: 'broken.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('not,really,a,proper,csv\n"unterminated'),
  });
  await page.getByRole('button', { name: /upload/i }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText(/import_failed/);
  await expect(alert).toContainText(/csv/i);
});
