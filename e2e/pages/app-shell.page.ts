import { Page, expect } from '@playwright/test';

// Convention: page object selectors MUST use page.getByRole / page.getByLabel /
// page.getByTestId — never raw CSS or XPath. This file currently only contains
// a navigation helper, so the rule is moot here, but any future selectors
// added to AppShellPage must follow it.
export class AppShellPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('body')).toBeVisible();
  }
}
