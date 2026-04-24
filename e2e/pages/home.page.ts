import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/home'); }
  title()       { return this.page.getByRole('heading', { name: 'Find anyone.' }); }
  subtitle()    { return this.page.getByTestId('hero-subtitle'); }
  searchInput() { return this.page.getByRole('searchbox', { name: 'Search contacts' }); }
}
