import { Page } from '@playwright/test';

export class ContactDetailPage {
  constructor(private page: Page) {}
  async goto(id: string) { await this.page.goto(`/contacts/${id}`); }
  heroName()    { return this.page.getByTestId('hero-name'); }
  heroRole()    { return this.page.getByTestId('hero-role'); }
  tags()        { return this.page.getByTestId('hero-tags').getByRole('listitem'); }
  timelineItems() { return this.page.getByTestId('timeline').getByRole('listitem'); }
  seeAllLink()  { return this.page.getByRole('link', { name: /See all \d+/ }); }
  starButton()  { return this.page.getByRole('button', { name: 'Star contact' }); }
}
