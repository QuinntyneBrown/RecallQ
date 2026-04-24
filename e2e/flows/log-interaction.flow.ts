import { Page, expect } from '@playwright/test';
import { AddInteractionPage } from '../pages/add-interaction.page';

export interface LogInteractionOptions {
  type: 'email' | 'call' | 'meeting' | 'note';
  content: string;
}

export async function logInteractionFlow(
  page: Page,
  contactId: string,
  opts: LogInteractionOptions,
) {
  const add = new AddInteractionPage(page);
  await add.goto(contactId);
  await add.selectType(opts.type);
  await add.setContent(opts.content);
  await add.save();
  await expect(page).toHaveURL(new RegExp(`/contacts/${contactId}$`));
}

export default logInteractionFlow;
