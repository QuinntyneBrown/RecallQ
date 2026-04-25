// Covers bug: docs/bugs/citation-card-avatar-ignores-server-colors.md
// Flow 20 specifies citations include avatarColors. Stub /api/ask
// to emit a citation with custom avatarColorA / avatarColorB and
// assert the rendered avatar's inline background includes those
// hex values. With the fallback-gradient bug, the inline style is
// empty.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('citation avatar uses contact-specific avatarColorA / avatarColorB', async ({ page }) => {
  await page.route('**/api/ask', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body:
        'data: {"token":"Hi"}\n\n' +
        'event: citations\ndata: {"items":[{' +
          '"contactId":"00000000-0000-0000-0000-0000000000aa",' +
          '"contactName":"Sarah Mitchell",' +
          '"contactRole":"VP Product",' +
          '"contactOrganization":"Stripe",' +
          '"avatarColorA":"#FF6B6B",' +
          '"avatarColorB":"#4ECDC4",' +
          '"snippet":"Series B fit",' +
          '"similarity":0.91,' +
          '"source":"contact"' +
        '}]}\n\n' +
        'event: done\ndata: {}\n\n',
    }),
  );

  const email = `cit-color-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');
  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await input.fill('who matches?');
  await input.press('Enter');

  const avatar = page.getByTestId('citation-card').first().locator('.avatar');
  await expect(avatar).toBeVisible();

  // The inline style attribute must include both color stops. Browsers
  // normalize hex to rgb() in the style attribute, so accept either.
  const style = (await avatar.getAttribute('style') ?? '').toLowerCase();
  expect(style.includes('#ff6b6b') || style.includes('rgb(255, 107, 107)')).toBe(true);
  expect(style.includes('#4ecdc4') || style.includes('rgb(78, 205, 196)')).toBe(true);
});
