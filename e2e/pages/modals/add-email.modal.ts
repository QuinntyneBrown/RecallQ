import { Page, expect } from '@playwright/test';

export class AddEmailModal {
  constructor(private page: Page) {}
  async isOpen() { await expect(this.page.getByRole('dialog')).toBeVisible(); }
  async fill(v: string) { await this.page.getByRole('textbox', { name: 'Email' }).fill(v); }
  async save() { await this.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); }
  async cancel() { await this.page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click(); }
}
