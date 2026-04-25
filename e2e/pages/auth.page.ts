import { Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}
  async gotoRegister() { await this.page.goto('/register'); }
  async gotoLogin() { await this.page.goto('/login'); }
  async register(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }
  async login(email: string, password: string, rememberMe = false) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    if (rememberMe) {
      await this.page.getByRole('checkbox', { name: 'Remember me' }).click();
    }
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
  async logout() {
    await this.page.getByRole('button', { name: 'Profile' }).click();
    await this.page.getByRole('menuitem', { name: 'Log out' }).click();
  }
}
