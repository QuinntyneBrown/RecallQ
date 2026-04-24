import { Page, expect } from '@playwright/test';

// Convention: page object selectors MUST use page.getByRole / page.getByLabel /
// page.getByTestId — never raw CSS or XPath.
export class AppShellPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('body')).toBeVisible();
  }

  mobileFrame() {
    return {
      statusBar:     this.page.getByTestId('status-bar'),
      bottomNav:     this.page.getByRole('navigation', { name: 'Main' }),
      homeIndicator: this.page.getByTestId('home-indicator'),
    };
  }
}
