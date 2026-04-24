import { Page, expect } from '@playwright/test';
import { SearchResultsPage } from '../pages/search-results.page';

export async function searchFromHome(page: Page, q: string): Promise<SearchResultsPage> {
  await page.goto('/home');
  const box = page.getByRole('searchbox', { name: 'Search contacts' });
  await box.fill(q);
  await box.press('Enter');
  await expect(page).toHaveURL(/\/search/);
  return new SearchResultsPage(page);
}
