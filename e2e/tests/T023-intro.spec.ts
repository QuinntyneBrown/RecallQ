// Traces to: L2-039
// Task: T023
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { IntroModal } from '../pages/modals/intro.modal';
import { screenshot } from '../fixtures/screenshot';

async function installNavHook(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    (window as unknown as { __navCalls: string[] }).__navCalls = [];
    (window as unknown as { __rqNav: (h: string) => boolean }).__rqNav = (href: string) => {
      (window as unknown as { __navCalls: string[] }).__navCalls.push(href);
      return true;
    };
  });
}

async function createContactViaApi(
  page: import('@playwright/test').Page,
  payload: { displayName: string; initials: string; emails?: string[] },
): Promise<string> {
  const res = await page.request.post('/api/contacts', { data: payload });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.id as string;
}

function uniqueEmail() {
  return `t023-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test.describe('T023 intro draft', () => {
  test('draft, copy, and send via email', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permission API is chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const aId = await createContactViaApi(page, {
      displayName: 'Alice Alpha',
      initials: 'AA',
      emails: ['alice@example.com'],
    });
    await createContactViaApi(page, {
      displayName: 'Bob Bravo',
      initials: 'BB',
      emails: ['bob@example.com'],
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(aId);

    const modal = new IntroModal(page);
    await modal.open(pom);
    await modal.isOpen();

    await modal.typeQuery('Bob');
    await modal.pick('Bob Bravo');
    await modal.generate();

    await expect(modal.body()).toBeVisible();
    const bodyText = await modal.body().inputValue();
    expect(bodyText.length).toBeGreaterThan(0);

    await modal.copy();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(bodyText);

    await screenshot(page, 'T023-intro');

    await modal.send();
    const navCalls = await page.evaluate(
      () => (window as unknown as { __navCalls: string[] }).__navCalls,
    );
    const mailto = navCalls.find(h => h.startsWith('mailto:'));
    expect(mailto).toBeDefined();
    expect(mailto!).toContain('subject=');
    expect(mailto!).toContain('body=');
  });
});
