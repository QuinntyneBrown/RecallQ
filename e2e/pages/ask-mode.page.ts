import { Page } from '@playwright/test';

export class AskModePage {
  constructor(private page: Page) {}
  async goto(seed?: string) { await this.page.goto(`/ask${seed ? `?q=${encodeURIComponent(seed)}` : ''}`); }
  async type(q: string) { await this.page.getByRole('textbox', { name: 'Ask anything' }).fill(q); }
  async send() { await this.page.getByRole('button', { name: 'Send' }).click(); }
  userBubbles()      { return this.page.getByTestId('user-bubble'); }
  assistantBubbles() { return this.page.getByTestId('assistant-bubble'); }
  greetBubble()      { return this.page.getByTestId('greet-bubble'); }
  inputBar()         { return this.page.getByTestId('input-bar'); }
  citations()        { return this.page.getByTestId('citation-card'); }
  followUps()        { return this.page.getByTestId('follow-up-chip'); }
  async tapFollowUp(n: number) { await this.followUps().nth(n).click(); }
}
