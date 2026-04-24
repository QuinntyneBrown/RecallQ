# T032 — E2E Major Flow: Register → Add Contact → Search → Detail

| | |
|---|---|
| **Slice** | Cross-cutting integration of slices 02, 03, 04, 07, 08, 09 |
| **L2 traces** | L2-001, L2-002, L2-005, L2-009, L2-014, L2-017, L2-034, L2-082, L2-083 |
| **Prerequisites** | T006, T007, T008, T011, T013, T014 |
| **Produces UI** | Yes |

## Objective

Lock the "golden path" end-to-end with a single Playwright spec using composed POM flows. A new user registers, adds 3 contacts with distinct profile text, waits for embeddings, searches with a natural-language query, opens the best-matching contact, and reviews detail.

## Scope

**In:**
- One spec file `tests/T032-golden-path.spec.ts`.
- `flows/register.flow.ts`, `flows/add-contact.flow.ts`, `flows/search.flow.ts` composed — no bespoke selectors inside the spec.
- Three screenshots at key steps: home with 3 contacts, search results, contact detail.

**Out:**
- Any production code — this task is purely an integration spec. If it reveals bugs, open follow-up tasks to fix.

## ATDD workflow

1. **Red — e2e**:
   ```ts
   // Traces to: L2-001, L2-005, L2-014, L2-017, L2-034, L2-082
   // Task: T032
   test('golden path: register, add contacts, search, detail', async ({ page }) => {
     const auth = new AuthPage(page);
     const home = new HomePage(page);
     const add  = new AddContactPage(page);
     const search = new SearchResultsPage(page);
     const detail = new ContactDetailPage(page);

     await registerFlow(page, `alice+${Date.now()}@example.com`, 'correcthorsebattery');
     await home.goto();
     await screenshot(page, 'T032-1-home-empty');

     await addContactFlow(page, { displayName: 'Sarah Mitchell', role: 'VP Product', organization: 'Stripe', tags: ['Investor','Series B'], emails:['s@stripe.com'] });
     await addContactFlow(page, { displayName: 'Alex Chen',       role: 'CTO',        organization: 'Anthropic', tags:['AI','evals'] });
     await addContactFlow(page, { displayName: 'Marcus Reyes',    role: 'Partner',    organization: 'Sequoia',   tags:['Investor'] });

     // wait for embeddings (poll until /api/search returns non-empty for a known phrase)
     await expect.poll(async () => (await api.search('investor')).results.length).toBeGreaterThan(0);

     await home.goto();
     await screenshot(page, 'T032-2-home-with-contacts');

     await searchFlow(page, 'investors who liked AI tools');
     await expect(search.featured()).toBeVisible();
     await screenshot(page, 'T032-3-search');

     await search.featured().click();
     await expect(detail.heroName()).toContainText(/Mitchell|Chen|Reyes/);
     await screenshot(page, 'T032-4-detail');
   });
   ```

2. **Green** — run, all assertions pass. If any assertion is red after T006–T014 are complete, open a bugfix follow-up rather than weakening the assertion.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The spec file uses no raw `page.locator('…')`; every selector is encapsulated in a page object.
- [ ] Arrange uses the POM flows or `seed-api.ts` — never a mix of UI and API arrange that obscures intent.
- [ ] Embedding wait uses `expect.poll` — no `await page.waitForTimeout(N)` calls.

## Screenshots

- `T032-1-home-empty.png`
- `T032-2-home-with-contacts.png`
- `T032-3-search.png`
- `T032-4-detail.png`

## Definition of Done

- [ ] Spec passes consistently (10 runs green).
- [ ] Screenshots saved and visually representative.
- [ ] Three verification passes complete clean.
