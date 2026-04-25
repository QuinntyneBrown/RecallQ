import { Page, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

export async function registerAndLogin(page: Page, email: string, password: string) {
  const auth = new AuthPage(page);
  await auth.gotoRegister();
  await auth.register(email, password);
  // Wait for navigation after registration
  await page.waitForNavigation();
  // Check what URL we're actually on
  const currentUrl = page.url();
  console.log(`After registration, URL is: ${currentUrl}`);
  // If not on home, navigate there
  if (!/\/home$/.test(currentUrl)) {
    console.log('Not on home page, navigating...');
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
  }
  // Verify the home page heading is visible
  await expect(page.getByRole('heading', { name: 'Find anyone.' })).toBeVisible({ timeout: 5_000 });
}

export { registerAndLogin as registerFlow };
