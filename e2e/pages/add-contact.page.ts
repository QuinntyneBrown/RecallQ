import { Page } from '@playwright/test';

export class AddContactPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/contacts/new'); }
  async fill(c: { displayName: string; initials?: string; role?: string; organization?: string; location?: string; tags?: string[]; emails?: string[]; phones?: string[] }) {
    await this.page.getByLabel('Display name').fill(c.displayName);
    if (c.initials !== undefined) await this.page.getByLabel('Initials').fill(c.initials);
    if (c.role) await this.page.getByLabel('Role').fill(c.role);
    if (c.organization) await this.page.getByLabel('Organization').fill(c.organization);
    if (c.location) await this.page.getByLabel('Location').fill(c.location);
    if (c.tags) for (const t of c.tags) {
      await this.page.getByLabel('Tags').fill(t);
      await this.page.getByLabel('Tags').press('Enter');
    }
    if (c.emails && c.emails.length) await this.page.getByLabel('Email').fill(c.emails[0]);
    if (c.phones && c.phones.length) await this.page.getByLabel('Phone').fill(c.phones[0]);
  }
  async save() { await this.page.getByRole('button', { name: 'Save' }).click(); }
}
