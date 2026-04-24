import { Page } from '@playwright/test';

export class AddInteractionPage {
  constructor(private page: Page) {}
  async goto(contactId: string) { await this.page.goto(`/contacts/${contactId}/interactions/new`); }
  async selectType(t: 'email' | 'call' | 'meeting' | 'note') {
    await this.page.getByRole('radio', { name: new RegExp(t, 'i') }).check({ force: true });
  }
  async setContent(text: string) { await this.page.getByLabel('Content').fill(text); }
  async save() { await this.page.getByRole('button', { name: 'Save' }).click(); }
}
