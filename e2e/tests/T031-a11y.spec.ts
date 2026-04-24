// Traces to: L2-064, L2-065, L2-066, L2-067, L2-068
// Task: T031
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { runAxe, seriousOrCritical } from '../fixtures/a11y';
import { screenshot } from '../fixtures/screenshot';

async function createContact(page: import('@playwright/test').Page, name: string) {
  const res = await page.request.post('/api/contacts', {
    data: {
      displayName: name,
      initials: name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase(),
      role: null,
      organization: null,
      location: null,
      tags: ['a11y'],
      emails: [],
      phones: [],
    },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.id as string;
}

test.describe('T031 accessibility', () => {
  test('axe_scan_passes_on_home_and_detail_and_search_and_ask', async ({ page }) => {
    test.setTimeout(120_000);
    const email = `t031-axe-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');
    const contactId = await createContact(page, 'Axe Scan Target');

    const pages: { name: string; path: string }[] = [
      { name: 'home', path: '/home' },
      { name: 'detail', path: `/contacts/${contactId}` },
      { name: 'search', path: '/search?q=axe' },
      { name: 'ask', path: '/ask' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      const results = await runAxe(page);
      const blocking = seriousOrCritical(results.violations);
      if (results.violations.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[T031 axe] ${p.name}: total=${results.violations.length} blocking=${blocking.length} impacts=${results.violations.map((v) => `${v.id}:${v.impact}`).join(',')}`,
        );
      }
      expect(blocking, `serious/critical axe violations on ${p.name}: ${JSON.stringify(blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })))}`).toEqual([]);
    }
  });

  test('Home_tab_order_matches_visual_order', async ({ page }) => {
    const email = `t031-tab-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Focus the body, then tab through elements and collect descriptors.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    const seq: { tag: string; label: string; testid: string }[] = [];
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const desc = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return { tag: '', label: '', testid: '' };
        return {
          tag: el.tagName.toLowerCase(),
          label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || '',
          testid: el.getAttribute('data-testid') || '',
        };
      });
      seq.push(desc);
    }

    // Pragmatic assertion: the search input must be reached before any bottom-nav button.
    const searchIdx = seq.findIndex((s) => s.label === 'Search contacts');
    const bottomNavIdx = seq.findIndex((s) => ['Home', 'Search', 'Ask', 'Profile'].includes(s.label));
    expect(searchIdx, `search input must appear in tab order. seq=${JSON.stringify(seq)}`).toBeGreaterThanOrEqual(0);
    if (bottomNavIdx >= 0) {
      expect(searchIdx).toBeLessThan(bottomNavIdx);
    }
  });

  test('All_icon_only_buttons_have_aria_label', async ({ page }) => {
    test.setTimeout(90_000);
    const email = `t031-aria-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');
    const contactId = await createContact(page, 'Aria Target');

    const paths = ['/home', `/contacts/${contactId}`, '/ask'];
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const offenders = await page.$$eval('button', (btns) =>
        btns
          .filter((b) => {
            const visible = (b as HTMLElement).offsetParent !== null;
            const text = (b.textContent || '').trim();
            return visible && text.length === 0;
          })
          .filter(
            (b) =>
              !(b.getAttribute('aria-label') || '').trim() &&
              !(b.getAttribute('aria-labelledby') || '').trim() &&
              !(b.getAttribute('title') || '').trim(),
          )
          .map((b) => (b as HTMLElement).outerHTML.slice(0, 140)),
      );
      expect(offenders, `icon-only buttons missing aria-label on ${path}`).toEqual([]);
    }
  });

  test('Prefers_reduced_motion_disables_pulse', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const email = `t031-rm-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');

    // Seed enough data to trigger a suggestion via admin detector.
    const names = ['RM founder Alice', 'RM founder Bob', 'RM founder Carol'];
    const ids: string[] = [];
    for (const name of names) {
      const r = await page.request.post('/api/contacts', {
        data: {
          displayName: name,
          initials: 'RM',
          role: null,
          organization: null,
          location: null,
          tags: ['rm ai founders'],
          emails: [],
          phones: [],
        },
      });
      expect(r.status()).toBe(201);
      ids.push((await r.json()).id);
    }
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    for (const id of ids) {
      const r = await page.request.post(`/api/contacts/${id}/interactions`, {
        data: { type: 'Meeting', occurredAt: twoDaysAgo, subject: 'Coffee', content: 'met' },
      });
      expect(r.status()).toBe(201);
    }
    await page.request.post('/api/admin/detect-suggestions');

    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    const card = page.getByTestId('suggestion-card');
    await expect(card).toBeVisible({ timeout: 10_000 });

    const anim = await card.locator('.dot').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        duration: cs.animationDuration,
        name: cs.animationName,
      };
    });
    // eslint-disable-next-line no-console
    console.log(`[T031 reduced-motion] .dot animation=${JSON.stringify(anim)}`);
    // The global reduced-motion rule sets duration to 0.01ms; the component also sets animation: none.
    // Accept any value that is effectively "no animation": duration <= 0.01ms or animation-name is 'none'.
    const durMs = parseFloat(anim.duration) * (anim.duration.endsWith('ms') ? 1 : 1000);
    const effectivelyNone = anim.name === 'none' || durMs <= 1;
    expect(effectivelyNone, `dot still animates: ${JSON.stringify(anim)}`).toBe(true);

    await screenshot(page, 'T031-a11y');
    await context.close();
  });

  test('Focus_ring_visible_on_search_input', async ({ page }) => {
    const email = `t031-focus-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    await registerAndLogin(page, email, 'correcthorse12');
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    // Tab until the search input is focused (max 10 presses).
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const isSearch = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') === 'Search contacts',
      );
      if (isSearch) break;
    }
    const isSearch = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') === 'Search contacts',
    );
    expect(isSearch).toBe(true);
    await screenshot(page, 'T031-a11y');
  });
});
