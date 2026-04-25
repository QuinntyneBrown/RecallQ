import { Page, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

export async function registerAndLogin(page: Page, email: string, password: string) {
  const auth = new AuthPage(page);
  await auth.gotoRegister();
  await auth.register(email, password);
  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
}

export { registerAndLogin as registerFlow };
