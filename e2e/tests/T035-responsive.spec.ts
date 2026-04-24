// Traces to: L2-041, L2-042, L2-043, L2-044, L2-045, L2-046
// Task: T035
import { test, expect, Page } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { createContact } from '../flows/add-contact.flow';
import { api } from '../flows/api';
import { AppShellPage } from '../pages/app-shell.page';
import { HomePage } from '../pages/home.page';
import { SearchResultsPage } from '../pages/search-results.page';
import { VIEWPORTS, ViewportName } from '../fixtures/viewports';
import { screenshot } from '../fixtures/screenshot';

const ORDER: ViewportName[] = ['xs', 'sm', 'md', 'lg', 'xl'];

test('T035 responsive sweep xs/sm/md/lg/xl', async ({ page }) => {
  test.setTimeout(180_000);

  // Start at XS so initial registration UI is mobile.
  await page.setViewportSize(VIEWPORTS.xs);
  const email = `t035-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Seed 3 contacts (via UI flow so auth/session is consistent).
  await createContact(page, { displayName: 'Investor Alice Alpha', initials: 'IA' });
  await createContact(page, { displayName: 'Investor Bob Beta',   initials: 'IB' });
  await createContact(page, { displayName: 'Investor Carol Gamma',initials: 'IC' });

  // Wait for embeddings via expect.poll — no waitForTimeout.
  await expect
    .poll(async () => (await api(page).search('investor')).results.length, {
      timeout: 60_000,
      intervals: [500, 1000, 2000],
    })
    .toBeGreaterThanOrEqual(2);

  const shell = new AppShellPage(page);
  const home = new HomePage(page);
  const results = new SearchResultsPage(page);

  const touchTargets: Record<string, { width: number; height: number }[]> = {};

  for (const key of ORDER) {
    await page.setViewportSize(VIEWPORTS[key]);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(home.searchInput()).toBeVisible();

    await screenshot(page, `T035-home-${key}`);

    // Landmarks
    if (key === 'xs' || key === 'sm') {
      expect(await shell.isBottomNavVisible()).toBe(true);
    } else {
      await expect(shell.sidebar()).toBeVisible();
      await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(0);
    }

    // Touch-target check at XS on bottom-nav tabs. Home/Search/Ask
    // render as <a routerLink>, Profile stays a <button>, so query
    // both roles.
    if (key === 'xs') {
      const boxes = await page.$$eval(
        'nav[aria-label="Main"] a, nav[aria-label="Main"] button',
        (els) =>
          els.map((el) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return { width: r.width, height: r.height };
          }),
      );
      touchTargets.xs = boxes;
      expect(boxes.length).toBeGreaterThan(0);
      for (const b of boxes) {
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Search
    await page.goto(`/search?q=investor`);
    await expect(page.getByTestId('query-chip')).toContainText('investor');
    await expect
      .poll(async () => {
        const featuredVisible = await results.featured().isVisible().catch(() => false);
        const count = await results.standardCards().count();
        return featuredVisible || count > 0 ? 1 : 0;
      }, { timeout: 30_000 })
      .toBe(1);

    await screenshot(page, `T035-search-${key}`);

    // Click first result — featured if present else first standard card.
    const hasFeatured = await results.featured().isVisible().catch(() => false);
    const firstResult = hasFeatured ? results.featured() : results.standardCards().first();

    if (key === 'lg' || key === 'xl') {
      await expect(results.detailPane()).toBeVisible();
      await expect(results.detailPlaceholder()).toBeVisible();
      await firstResult.click();
      await expect(results.detailPlaceholder()).toHaveCount(0);
      await expect(results.detailPane().getByTestId('detail-name')).toBeVisible();
      await expect(page).toHaveURL(/\/search/); // did NOT navigate
    } else {
      await firstResult.click();
      await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
    }
  }

  // Resize preservation: XS -> LG keeps home search input value.
  await page.setViewportSize(VIEWPORTS.xs);
  await page.goto('/home');
  await home.searchInput().fill('resizeme');
  await expect(home.searchInput()).toHaveValue('resizeme');

  await page.setViewportSize(VIEWPORTS.lg);
  await expect(home.searchInput()).toHaveValue('resizeme');

  // Report measurements to the test log for the operator.
  console.log('T035 touch-target boxes (xs bottom-nav):', JSON.stringify(touchTargets.xs));
});
