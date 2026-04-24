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
  summaryParagraph() { return this.page.getByTestId('summary-paragraph'); }
  statInteractions() { return this.page.getByTestId('stat-interactions'); }
  statSentiment()    { return this.page.getByTestId('stat-sentiment'); }
  statSinceLast()    { return this.page.getByTestId('stat-since-last'); }
  async tapRefreshSummary() { await this.page.getByRole('button', { name: 'Refresh summary' }).click(); }
}
