// Covers bug: docs/bugs/form-inputs-strip-outline-without-replacement-focus-ring.md
// Flow 40 — every interactive element must show a visible focus
// indicator. The Ask input bar and add/edit-interaction form inputs
// strip outline:none with no replacement; assert a focus ring exists.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';

async function focusedRingPresent(page: import('@playwright/test').Page, selector: string): Promise<boolean> {
  return page.locator(selector).evaluate((el) => {
    el.focus();
    const style = getComputedStyle(el);
    const outline = style.outlineWidth;
    const ring = style.boxShadow;
    const outlineVisible = outline !== '0px' && outline !== '';
    const ringVisible = ring !== 'none' && ring.length > 0;
    return outlineVisible || ringVisible;
  });
}

test('Ask input bar has a visible focus ring when focused', async ({ page }) => {
  const email = `frask-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/ask');
  expect(await focusedRingPresent(page, '.input-bar input')).toBe(true);
});

test('Add contact form fields have a visible focus ring', async ({ page }) => {
  const email = `frac-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  await page.goto('/contacts/new');
  expect(await focusedRingPresent(page, '.field input')).toBe(true);
});
