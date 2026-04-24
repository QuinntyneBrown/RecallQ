// Traces to: L2-001, L2-002, L2-005, L2-009, L2-014, L2-017, L2-034, L2-082, L2-083
// Task: T032
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { HomePage } from '../pages/home.page';
import { AddContactPage } from '../pages/add-contact.page';
import { SearchResultsPage } from '../pages/search-results.page';
import { ContactDetailPage } from '../pages/contact-detail.page';
import { registerFlow } from '../flows/register.flow';
import { addContactFlow } from '../flows/add-contact.flow';
import { searchFlow } from '../flows/search.flow';
import { api } from '../flows/api';
import { screenshot } from '../fixtures/screenshot';

test('golden path: register, add contacts, search, detail', async ({ page }) => {
  const auth = new AuthPage(page);
  const home = new HomePage(page);
  const add = new AddContactPage(page);
  const search = new SearchResultsPage(page);
  const detail = new ContactDetailPage(page);

  // NOTE: Task literal "correcthorsebattery" lacks a digit and fails server
  // password validation (12+ chars with at least one letter and one digit).
  // Using "correcthorseb4ttery" as a minimal-deviation compliant substitute.
  await registerFlow(page, `alice+${Date.now()}@example.com`, 'correcthorseb4ttery');
  await home.goto();
  await screenshot(page, 'T032-1-home-empty');

  await addContactFlow(page, { displayName: 'Sarah Mitchell', role: 'VP Product', organization: 'Stripe', tags: ['Investor', 'Series B'], emails: ['s@stripe.com'] });
  await addContactFlow(page, { displayName: 'Alex Chen',       role: 'CTO',        organization: 'Anthropic', tags: ['AI', 'evals'] });
  await addContactFlow(page, { displayName: 'Marcus Reyes',    role: 'Partner',    organization: 'Sequoia',   tags: ['Investor'] });

  // Wait for embeddings — poll until /api/search returns non-empty for a known phrase.
  await expect
    .poll(async () => (await api(page).search('investor')).results.length, { timeout: 30_000 })
    .toBeGreaterThan(0);

  await home.goto();
  await screenshot(page, 'T032-2-home-with-contacts');

  await searchFlow(page, 'investors who liked AI tools');
  await expect(search.featured()).toBeVisible();
  await screenshot(page, 'T032-3-search');

  await search.featured().click();
  await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]+$/);
  await expect(detail.heroName()).toContainText(/Mitchell|Chen|Reyes/);
  await screenshot(page, 'T032-4-detail');
});
