import { Page } from '@playwright/test';

export class SearchResultsPage {
  constructor(private page: Page) {}
  async gotoQuery(q: string) { await this.page.goto(`/search?q=${encodeURIComponent(q)}`); }
  queryChipText() { return this.page.getByTestId('query-chip').innerText(); }
  matchedCount()  { return this.page.getByTestId('match-count').innerText(); }
  featured()      { return this.page.getByTestId('featured-result'); }
  standardCards() { return this.page.getByTestId('result-card'); }
  zeroState()     { return this.page.getByTestId('zero-state'); }

  async pickSort(label: 'Similarity' | 'Most recent') {
    await this.page.getByRole('button', { name: 'Sort' }).click();
    await this.page.getByRole('menuitem', { name: label }).click();
  }
  async openSort() {
    await this.page.getByRole('button', { name: 'Sort' }).click();
  }
  async scrollToBottom() {
    const viewport = this.page.getByTestId('results-viewport');
    await viewport.evaluate((el: HTMLElement) => { el.scrollTop = el.scrollHeight; });
  }
  domCardCount() {
    return this.page.getByTestId('result-card').count();
  }
}
