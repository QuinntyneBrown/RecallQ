import { Page, expect } from '@playwright/test';
import { AddContactPage } from '../pages/add-contact.page';

export interface ContactInput {
  displayName: string;
  initials?: string;
  role?: string;
  organization?: string;
  location?: string;
  tags?: string[];
  emails?: string[];
  phones?: string[];
}

export async function createContact(page: Page, contact: ContactInput): Promise<string> {
  const pom = new AddContactPage(page);
  await pom.goto();
  await pom.fill(contact);
  await pom.save();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
  const url = page.url();
  const match = url.match(/\/contacts\/([0-9a-f-]+)$/);
  if (!match) throw new Error('contact id not found in URL: ' + url);
  return match[1];
}
