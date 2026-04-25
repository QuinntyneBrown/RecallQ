// Covers bug: docs/bugs/star-icon-disappears-when-starred-uses-undefined-phosphor-class.md
// Flow 10 — when a contact is starred the star icon must continue to
// render a glyph. The previous implementation set the class to
// `ph-star-fill`, which is undefined in @phosphor-icons/web v2 (fill
// weight uses the compound selector `.ph-fill.ph-star`), so the icon
// disappeared on toggle. This test asserts the icon renders a non-empty
// glyph in both states by reading the computed `::before` content.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

const contactId = '00000000-0000-0000-0000-000000001011';

test('star icon renders a glyph in both starred and unstarred states', async ({ page }) => {
  let starred = false;
  await page.route(`**/api/contacts/${contactId}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Star Render',
          initials: 'SR',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    if (route.request().method() === 'PATCH') {
      starred = !starred;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contactId,
          displayName: 'Star Render',
          initials: 'SR',
          role: null,
          organization: null,
          location: null,
          tags: [],
          emails: [],
          phones: [],
          createdAt: '2025-12-15T00:00:00Z',
          starred,
          recentInteractions: [],
          interactionTotal: 0,
        }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/contacts/${contactId}/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ready', summary: '', generatedAt: null }),
    }),
  );

  const email = `sir-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto(`/contacts/${contactId}`);
  await expect(page.getByTestId('hero-name')).toHaveText('Star Render', { timeout: 15_000 });

  // Unstarred: the icon must render a glyph (::before content is set).
  const unstarredIcon = page.getByRole('button', { name: 'Star contact', exact: true }).locator('i');
  const unstarredContent = await unstarredIcon.evaluate(
    (el) => window.getComputedStyle(el, '::before').content,
  );
  expect(unstarredContent).not.toBe('none');
  expect(unstarredContent).not.toBe('normal');
  expect(unstarredContent.replace(/['"]/g, '').length).toBeGreaterThan(0);

  // Click to star.
  await page.getByRole('button', { name: 'Star contact', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unstar contact', exact: true })).toBeVisible();

  // Starred: the icon must STILL render a glyph. If the class
  // `ph-star-fill` is used and undefined, content resolves to `none`.
  const starredIcon = page.getByRole('button', { name: 'Unstar contact', exact: true }).locator('i');
  const starredContent = await starredIcon.evaluate(
    (el) => window.getComputedStyle(el, '::before').content,
  );
  expect(starredContent).not.toBe('none');
  expect(starredContent).not.toBe('normal');
  expect(starredContent.replace(/['"]/g, '').length).toBeGreaterThan(0);

  // Defensive: the starred icon's font-family should resolve to one of
  // the Phosphor families. The bug rendered an empty <i> with no font
  // mapping (no class matched), so this would also fail.
  const starredFont = await starredIcon.evaluate(
    (el) => window.getComputedStyle(el).fontFamily,
  );
  expect(starredFont.toLowerCase()).toContain('phosphor');
});
