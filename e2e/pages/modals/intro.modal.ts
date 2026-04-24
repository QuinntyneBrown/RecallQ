import { Page, expect } from '@playwright/test';

export class IntroModal {
  constructor(private page: Page) {}
  async open(fromDetail: unknown) {
    await this.page.getByRole('button', { name: 'Draft intro' }).click();
  }
  dialog() { return this.page.getByRole('dialog'); }
  async isOpen() { await expect(this.dialog()).toBeVisible(); }
  secondPartyInput() { return this.page.getByRole('textbox', { name: 'Second party' }); }
  async typeQuery(q: string) { await this.secondPartyInput().fill(q); }
  async pick(name: string) {
    await this.page.getByRole('option', { name }).click();
  }
  generateButton() { return this.dialog().getByRole('button', { name: 'Generate draft' }); }
  async generate() { await this.generateButton().click(); }
  body() { return this.page.getByRole('textbox', { name: 'Draft body' }); }
  async copy() { await this.dialog().getByRole('button', { name: 'Copy' }).click(); }
  async send() { await this.dialog().getByRole('button', { name: 'Send via email' }).click(); }
}
