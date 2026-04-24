// Traces to: L2-016, L2-017, L2-020, L2-082
// Task: T014
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { searchFromHome } from '../flows/search.flow';
import { SearchResultsPage } from '../pages/search-results.page';
import { screenshot } from '../fixtures/screenshot';

async function waitForEmbeddings(page: any, q: string, expected: number, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await page.request.post('/api/search', { data: { q } });
    if (res.status() === 200) {
      const body = await res.json();
      if ((body.contactsMatched ?? 0) >= expected) return;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`timed out waiting for ${expected} embeddings to be ready`);
}

test('T014 results render with featured and standard cards and score tiers', async ({ page }) => {
  const email = `t014-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const idA = await createContact(page, { displayName: 'VC Investors in AI', initials: 'VI' });
  const idB = await createContact(page, { displayName: 'Frankie Foobar', initials: 'FF' });
  const idC = await createContact(page, { displayName: 'Gina Generic', initials: 'GG' });
  const createdIds = new Set([idA, idB, idC]);

  await waitForEmbeddings(page, 'VC Investors in AI', 3);

  const pom = await searchFromHome(page, 'VC Investors in AI');
  await expect(page).toHaveURL(/\/search\?q=/);

  await expect(pom.featured()).toBeVisible();
  expect((await pom.queryChipText()).trim()).toBe('VC Investors in AI');

  const standardCount = await pom.standardCards().count();
  expect(standardCount).toBeGreaterThanOrEqual(1);

  // Score chip format d.dd
  const featuredScore = pom.featured().locator('[data-tier]').first();
  await expect(featuredScore).toHaveText(/^\d\.\d{2}$/);

  await screenshot(page, 'T014-search-results');

  await pom.featured().click();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
  const match = page.url().match(/\/contacts\/([0-9a-f-]+)$/);
  expect(match).not.toBeNull();
  expect(createdIds.has(match![1])).toBe(true);
});

test('T014 zero state when no contacts', async ({ page }) => {
  const email = `t014z-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const pom = new SearchResultsPage(page);
  await pom.gotoQuery('foo');

  await expect(pom.zeroState()).toBeVisible();
  expect((await pom.matchedCount()).trim()).toBe('0 contacts matched');
});
