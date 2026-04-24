// Covers bug: docs/bugs/register-page-has-no-link-to-the-login-page.md
// /register has no affordance to navigate to /login, and /login lacks
// the inverse "Don't have an account? Create one" prompt. Returning
// users who land on /register by mistake can't reach /login without
// retyping the URL.
import { test, expect } from '@playwright/test';

test('register page links to /login', async ({ page }) => {
  await page.goto('/register');
  const login = page.getByRole('link', { name: /log in/i });
  await expect(login).toBeVisible();
  await expect(login).toHaveAttribute('href', /\/login$/);
});

test('login page links to /register', async ({ page }) => {
  await page.goto('/login');
  const register = page.getByRole('link', { name: /create one/i });
  await expect(register).toBeVisible();
  await expect(register).toHaveAttribute('href', /\/register$/);
});
