import { Page } from '@playwright/test';

export class ImportPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/import'); }
  async uploadFile(path: string) { await this.page.getByLabel('CSV file').setInputFiles(path); }
  async submit() { await this.page.getByRole('button', { name: 'Upload' }).click(); }
  importedCount() { return this.page.getByTestId('imported-count'); }
  failedCount()   { return this.page.getByTestId('failed-count'); }
  async expandErrors() { await this.page.getByRole('button', { name: /see \d+ errors/i }).click(); }
}
