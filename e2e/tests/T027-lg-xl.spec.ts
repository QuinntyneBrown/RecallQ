// Traces to: L2-044, L2-045, L2-046
// Task: T027
import { test, expect, Page } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { SearchResultsPage } from '../pages/search-results.page';
import { AppShellPage } from '../pages/app-shell.page';
import { VIEWPORTS } from '../fixtures/viewports';
import { screenshot } from '../fixtures/screenshot';

async function waitForEmbeddings(page: Page, q: string, expected: number, timeoutMs = 60_000): Promise<void> {
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

test('T027 LG/XL multi-pane with state preservation across resize', async ({ page }) => {
  // ---- Scenario 1: LG (1200x800) ----
  await page.setViewportSize(VIEWPORTS.lg);
  const email = `t027-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await createContact(page, { displayName: 'Foo Fighter Alpha', initials: 'FA' });
  await createContact(page, { displayName: 'Foo Bar Beta', initials: 'FB' });

  await waitForEmbeddings(page, 'foo', 2);

  const pom = new SearchResultsPage(page);
  await pom.gotoQuery('foo');

  await expect(pom.listPane()).toBeVisible();
  await expect(pom.detailPane()).toBeVisible();
  await expect(pom.detailPlaceholder()).toBeVisible();

  // Click the featured result (first result)
  await pom.featured().click();
  await expect(page).toHaveURL(/\/search\?/); // did not navigate away
  await expect(pom.detailPlaceholder()).toHaveCount(0);
  await expect(pom.detailPane().getByTestId('detail-name')).toBeVisible();
  const detailName = (await pom.detailPane().getByTestId('detail-name').innerText()).trim();
  expect(detailName.length).toBeGreaterThan(0);
  expect(/Foo/.test(detailName)).toBe(true);

  await screenshot(page, 'T027-lg');

  // ---- Scenario 2: XL (1440x900) ----
  await page.setViewportSize(VIEWPORTS.xl);
  await page.goto('/search?q=foo');

  const shell = new AppShellPage(page);
  await expect(shell.sidebar()).toBeVisible();
  await expect(pom.listPane()).toBeVisible();
  await expect(pom.detailPane()).toBeVisible();

  await screenshot(page, 'T027-xl');

  // ---- Scenario 3: Resize XS -> LG preserves search state ----
  await page.setViewportSize(VIEWPORTS.xs);
  const email2 = `t027r-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  await registerAndLogin(page, email2, 'correcthorse12');

  await createContact(page, { displayName: 'Resizeme Rex', initials: 'RR' });
  await waitForEmbeddings(page, 'resizeme', 1);

  await pom.gotoQuery('resizeme');
  await expect(page.getByTestId('query-chip')).toContainText('resizeme');
  await expect.poll(async () => (await pom.standardCards().count()) + (await pom.featured().count())).toBeGreaterThan(0);
  const beforeCount = await pom.standardCards().count();
  const featuredBefore = await pom.featured().isVisible();

  // resize to LG; state should survive (service-scoped signals)
  await page.setViewportSize(VIEWPORTS.lg);

  await expect(page.getByTestId('query-chip')).toContainText('resizeme');
  await expect(pom.listPane()).toBeVisible();
  await expect(pom.detailPane()).toBeVisible();
  await expect.poll(async () => (await pom.standardCards().count()) + (await pom.featured().count())).toBeGreaterThan(0);
  // results still visible (either featured card or standard cards)
  const afterCount = await pom.standardCards().count();
  const featuredAfter = await pom.featured().isVisible();
  expect(featuredAfter || afterCount > 0).toBe(true);
  expect(featuredBefore || beforeCount > 0).toBe(true);
});
