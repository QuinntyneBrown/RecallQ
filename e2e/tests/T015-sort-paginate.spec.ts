// Traces to: L2-018, L2-019, L2-062
// Task: T015
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { SearchResultsPage } from '../pages/search-results.page';
import { screenshot } from '../fixtures/screenshot';

const Q = 'foo';

test('T015 sort toggle and infinite scroll with DOM cap', async ({ page }) => {
  test.setTimeout(180_000);
  const email = `t015-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  // Seed 120 contacts via API. Keep concurrency bounded so this test does not
  // overload the shared E2E API while the full suite is running in parallel.
  const total = 120;
  const createContact = async (i: number) => {
    const data = {
      displayName: `foo target ${i}`,
      initials: 'FT',
      role: null,
      organization: null,
      location: null,
      tags: [],
      emails: [],
      phones: [],
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await page.request.post('/api/contacts', { data });
      if (response.status() === 201) return;

      const body = await response.text().catch(() => '');
      const retryable = response.status() >= 500 || response.status() === 429;
      if (!retryable || attempt === 3) {
        throw new Error(`Contact seed ${i} failed with ${response.status()}: ${body.slice(0, 500)}`);
      }
      await page.waitForTimeout(250 * attempt);
    }
  };

  const batchSize = 10;
  for (let offset = 0; offset < total; offset += batchSize) {
    await Promise.all(
      Array.from({ length: Math.min(batchSize, total - offset) }, (_, batchIndex) =>
        createContact(offset + batchIndex),
      ),
    );
  }

  await expect.poll(async () => {
    const res = await page.request.get('/api/contacts/count');
    if (res.status() !== 200) return 0;
    const body = await res.json();
    return body.contacts ?? 0;
  }, { timeout: 20_000 }).toBeGreaterThanOrEqual(total);

  // Poll until enough embeddings ready (>=50 matches) so the first page is full.
  const deadline = Date.now() + 120_000;
  let matched = 0;
  while (Date.now() < deadline) {
    const res = await page.request.post('/api/search', { data: { q: Q, page: 1, pageSize: 50 } });
    if (res.status() === 200) {
      const body = await res.json();
      matched = body.contactsMatched ?? 0;
      if (matched >= 50) break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  expect(matched).toBeGreaterThanOrEqual(50);

  // Count /api/search requests for pagination verification.
  const searchRequests: { page: number; sort: string }[] = [];
  page.on('request', req => {
    if (req.method() === 'POST' && req.url().includes('/api/search')) {
      try {
        const body = JSON.parse(req.postData() || '{}');
        searchRequests.push({ page: body.page ?? 1, sort: body.sort ?? 'similarity' });
      } catch { /* ignore */ }
    }
  });

  const pom = new SearchResultsPage(page);
  await pom.gotoQuery(Q);

  // Wait for initial results.
  await expect.poll(async () => searchRequests.filter(r => r.page === 1).length, { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId('results-viewport')).toBeVisible();
  // Some cards rendered (CDK virtualized, only visible subset).
  await expect.poll(async () => await pom.domCardCount(), { timeout: 20_000 }).toBeGreaterThan(0);

  // Track max DOM count — CDK virtualization should keep it small, well under 80.
  let maxDomCount = await pom.domCardCount();
  const observe = async () => {
    const n = await pom.domCardCount();
    if (n > maxDomCount) maxDomCount = n;
    return n;
  };

  // Scroll viewport to bottom repeatedly — the page=2 request should fire.
  for (let i = 0; i < 10; i++) {
    await pom.scrollToBottom();
    await observe();
    await new Promise(r => setTimeout(r, 300));
    if (searchRequests.some(r => r.page === 2)) break;
  }
  expect(searchRequests.some(r => r.page === 2)).toBe(true);

  await observe();
  expect(maxDomCount).toBeLessThanOrEqual(80);

  // Pick sort = Most recent — triggers new search with sort=recent in URL.
  await pom.pickSort('Most recent');
  await expect(page).toHaveURL(/sort=recent/);
  await expect.poll(async () => searchRequests.some(r => r.sort === 'recent'), { timeout: 20_000 }).toBe(true);
  await observe();
  expect(maxDomCount).toBeLessThanOrEqual(80);

  // Re-open sort menu for screenshot.
  await pom.openSort();
  await screenshot(page, 'T015-sort-paginate');

  test.info().annotations.push({ type: 'maxDomCount', description: String(maxDomCount) });
  console.log(`[T015] maxDomCount=${maxDomCount} (cap=80)`);
});
