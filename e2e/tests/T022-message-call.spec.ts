// Traces to: L2-037, L2-038
// Task: T022
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { AddEmailModal } from '../pages/modals/add-email.modal';
import { AddPhoneModal } from '../pages/modals/add-phone.modal';
import { screenshot } from '../fixtures/screenshot';
import { VIEWPORTS } from '../fixtures/viewports';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

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
  payload: {
    displayName: string;
    initials: string;
    emails?: string[];
    phones?: string[];
  },
): Promise<string> {
  const res = await page.request.post('/api/contacts', { data: payload });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.id as string;
}

function uniqueEmail() {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test.describe('T022 mobile scenarios', () => {
  test.use({ userAgent: IPHONE_UA });

  test('A: mobile, email present → mailto', async ({ page }) => {
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const contactId = await createContactViaApi(page, {
      displayName: 'Sarah Mitchell',
      initials: 'SM',
      emails: ['sarah@example.com'],
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(contactId);
    await expect(pom.messageTile()).toBeVisible();

    await pom.messageTile().click();

    await expect
      .poll(async () => await page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls))
      .toContain('mailto:sarah@example.com');

    await screenshot(page, 'T022-message-call');
  });

  test('B: mobile, no email → modal → patch → mailto', async ({ page }) => {
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const contactId = await createContactViaApi(page, {
      displayName: 'No Email',
      initials: 'NE',
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(contactId);
    await pom.messageTile().click();

    const modal = new AddEmailModal(page);
    await modal.isOpen();
    await modal.fill('new@example.com');
    await modal.save();

    await expect(pom.messageTile()).toHaveClass(/active/);

    await pom.messageTile().click();

    await expect
      .poll(async () => await page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls))
      .toContain('mailto:new@example.com');
  });

  test('C: mobile, phone present → tel', async ({ page }) => {
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const contactId = await createContactViaApi(page, {
      displayName: 'Phone Person',
      initials: 'PP',
      phones: ['+15551234'],
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(contactId);
    await pom.callTile().click();

    await expect
      .poll(async () => await page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls))
      .toContain('tel:+15551234');
  });

  test('B2: mobile, no phone → modal → patch → tel', async ({ page }) => {
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const contactId = await createContactViaApi(page, {
      displayName: 'No Phone',
      initials: 'NP',
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(contactId);
    await pom.callTile().click();

    const modal = new AddPhoneModal(page);
    await modal.isOpen();
    await modal.fill('+15559999');
    await modal.save();

    await expect(pom.callTile()).toHaveClass(/active/);

    await pom.callTile().click();
    await expect
      .poll(async () => await page.evaluate(() => (window as unknown as { __navCalls: string[] }).__navCalls))
      .toContain('tel:+15559999');
  });
});

test.describe('T022 desktop scenarios', () => {
  test.use({ viewport: VIEWPORTS.md });

  test('D: desktop, phone present → clipboard + toast', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permission API is chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await installNavHook(page);
    await registerAndLogin(page, uniqueEmail(), 'correcthorse12');

    const contactId = await createContactViaApi(page, {
      displayName: 'Desk Phone',
      initials: 'DP',
      phones: ['+15550000'],
    });

    const pom = new ContactDetailPage(page);
    await pom.goto(contactId);
    await pom.callTile().click();

    await expect
      .poll(async () => await page.evaluate(() => navigator.clipboard.readText()))
      .toBe('+15550000');

    await expect(page.getByRole('status')).toContainText(/copied/i);
  });
});
