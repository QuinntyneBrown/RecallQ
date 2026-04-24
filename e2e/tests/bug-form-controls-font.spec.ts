// Covers bug: docs/bugs/form-controls-fall-back-to-arial-instead-of-inter.md
// User-agent stylesheets set form-control font-family to Arial, so
// <input>, <button>, <select>, <textarea> don't inherit the Inter stack
// declared on html/body. The labels render in Inter while the controls
// render in Arial — visually inconsistent on the same form.
import { test, expect } from '@playwright/test';

test('form controls inherit the Inter font stack on /register', async ({ page }) => {
  await page.goto('/register');

  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  const button = page.getByRole('button', { name: 'Create account' });

  await expect(email).toBeVisible();

  for (const ctl of [email, password, button]) {
    const fontFamily = await ctl.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain('Inter');
  }
});
