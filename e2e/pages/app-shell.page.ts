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

  statusClock() {
    return this.page.getByTestId('status-clock');
  }

  async healthDot() {
    return this.page.getByTestId('health-dot');
  }

  async isOnline(): Promise<boolean> {
    const dot = await this.healthDot();
    return dot.evaluate(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)');
  }

  sidebar() {
    return this.page.getByRole('navigation', { name: 'Sidebar' });
  }

  isBottomNavVisible() {
    return this.page.getByRole('navigation', { name: 'Main' }).isVisible();
  }
}
