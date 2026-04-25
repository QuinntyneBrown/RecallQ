// Covers bug: docs/bugs/modals-submit-button-flat-purple.md
// Per docs/ui-design.pen Button Primary 8VJjL, the submit CTA is a
// brand-gradient pill at radius 999 with a purple shadow. The
// add-email modal Save button is currently flat purple at radius 14.
import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../flows/register.flow';
import { api } from '../flows/api';

test('add-email modal Save button matches button-primary pill', async ({ page }) => {
  const email = `msbp-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  await registerAndLogin(page, email, 'correcthorse12');

  const contact = await api(page).addContact({
    displayName: 'Sarah Mitchell',
    initials: 'SM',
  });
  expect(contact).not.toBeNull();

  await page.goto(`/contacts/${contact.id}`);
  await page.getByRole('button', { name: 'Email this contact' }).click();

  const submit = page.locator('app-add-email-modal button[type="submit"]');
  await expect(submit).toBeVisible({ timeout: 5_000 });

  const styles = await submit.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      borderRadius: cs.borderRadius,
      backgroundImage: cs.backgroundImage,
    };
  });

  // Pill radius — tokens map --radius-full to 999px; any value ≥ height/2
  // reads as a full pill.
  expect(parseFloat(styles.borderRadius)).toBeGreaterThanOrEqual(20);
  // Linear gradient with both brand stops.
  expect(styles.backgroundImage).toContain('linear-gradient');
  expect(styles.backgroundImage).toMatch(/124,\s*58,\s*255/); // #7C3AFF
  expect(styles.backgroundImage).toMatch(/255,\s*94,\s*231/); // #FF5EE7
});
