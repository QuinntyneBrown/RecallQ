// Covers bug: docs/bugs/citation-aria-label-missing-role-per-flow-41.md
// Flow 41 step 5: citation accessible name is "Contact: {name},
// {role}, similarity {score}". Today the implementation drops role
// and org. This test stubs /api/ask to return a citation with role +
// organization fields and asserts the rendered aria-label includes
// the role/org clause "VP Product at Stripe".
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

test('citation aria-label includes role and organization (flow 41 spec)', async ({ page }) => {
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
          '"snippet":"Series B fit",' +
          '"similarity":0.91,' +
          '"source":"contact"' +
        '}]}\n\n' +
        'event: done\ndata: {}\n\n',
    }),
  );

  const email = `cit-role-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');
  const input = page.getByRole('textbox', { name: 'Ask a question' });
  await input.fill('who matches?');
  await input.press('Enter');

  const citation = page.getByTestId('citation-card');
  await expect(citation).toBeVisible();

  // The aria-label must include the role clause per flow 41.
  await expect(citation).toHaveAttribute(
    'aria-label',
    /^Contact: Sarah Mitchell, VP Product at Stripe, similarity 0\.91$/,
  );
});
