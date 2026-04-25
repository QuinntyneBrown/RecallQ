// Covers bug: docs/bugs/zero-state-ask-recallq-not-styled-as-primary.md
// Flow 18 — Ask RecallQ in the zero-state must render as a primary
// button (gradient background + pill padding) not a flat text link.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('zero-state Ask RecallQ has primary-button styling', async ({ page }) => {
  await page.route('**/api/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], nextPage: null, contactsMatched: 0 }),
    }),
  );

  const email = `zsp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/search?q=ghostquery');

  const askLink = page.getByTestId('zero-state').getByRole('link', { name: 'Ask RecallQ' });
  await expect(askLink).toBeVisible();

  const computed = await askLink.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      backgroundImage: cs.backgroundImage,
      paddingTop: cs.paddingTop,
      paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderTopLeftRadius,
    };
  });

  expect(computed.backgroundImage).toContain('gradient');
  expect(parseFloat(computed.paddingTop)).toBeGreaterThan(0);
  expect(parseFloat(computed.paddingLeft)).toBeGreaterThan(0);
  expect(parseFloat(computed.borderRadius)).toBeGreaterThan(0);
});
