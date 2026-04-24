# T007 — Create Contact

| | |
|---|---|
| **Slice** | [03 Create contact](../detailed-designs/03-create-contact/README.md) |
| **L2 traces** | L2-005, L2-056, L2-076 |
| **Prerequisites** | T006 |
| **Produces UI** | Yes |

## Objective

Ship `POST /api/contacts` and the Add Contact form. On successful create, the user is navigated to `/contacts/:id` (the detail page arrives in T010 — for now it can temporarily show a placeholder "coming soon" detail page rendered from the DTO).

## Scope

**In:**
- `Contact` entity + `contacts` migration (Npgsql array columns for `tags`, `emails`, `phones`).
- Global query filter `OwnerUserId == _currentUser.Id`.
- `Endpoints/ContactsEndpoints.cs` → `MapContacts(app)` with one handler for POST.
- `Channel<EmbeddingJob>` singleton registration; writer injected into the handler (real worker lands in T011 — for now a no-op consumer can drain the channel).
- `AddContactPage` at `/contacts/new` with fields per L2-005.

**Out:**
- Update / delete / list (T008 covers list; patch comes alongside T010 star; delete deferred).
- Embedding generation (T011).

## ATDD workflow

1. **Red — API**:
   - `Create_contact_returns_201_and_persists_row` (L2-005).
   - `Create_contact_missing_displayName_400` (L2-005).
   - `Create_contact_over_120_chars_400` (L2-005).
   - `Create_contact_enqueues_embedding_job` (uses `FakeChannelWriter` capturing writes).
   - `Create_without_auth_returns_401` (L2-003).
   - `Owner_isolation_does_not_leak` (L2-056).
2. **Red — e2e**:
   - `T007-create-contact.spec.ts` — register via `flows/register.flow.ts`, navigate to `/contacts/new`, fill the form via `AddContactPage.fill(...)`, submit, assert redirect to `/contacts/:id` and that the DTO reflects the values.
3. **Green** — implement entity + migration + handler + page.

## Playwright POM

`pages/add-contact.page.ts`:
```ts
export class AddContactPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/contacts/new'); }
  async fill(c: { displayName: string; role?: string; organization?: string; tags?: string[]; emails?: string[] }) {
    await this.page.getByLabel('Display name').fill(c.displayName);
    if (c.role) await this.page.getByLabel('Role').fill(c.role);
    if (c.organization) await this.page.getByLabel('Organization').fill(c.organization);
    if (c.tags) for (const t of c.tags) {
      await this.page.getByLabel('Tags').fill(t);
      await this.page.getByLabel('Tags').press('Enter');
    }
    if (c.emails) await this.page.getByLabel('Email').fill(c.emails[0]);
  }
  async save() { await this.page.getByRole('button', { name: 'Save' }).click(); }
}
```

Add `flows/add-contact.flow.ts` that combines goto/fill/save and returns the new contact id from the URL.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Endpoint handler is ≤ 30 lines.
- [ ] No validation library is referenced; validation is inline.
- [ ] The form uses only standard HTML inputs + the `InputField` component from T006; no Material or external UI library.

## Screenshot

`docs/tasks/screenshots/T007-add-contact.png` — Add Contact form at 375×667 filled with a sample contact, right before submit.

## Definition of Done

- [ ] 6 API tests + 1 e2e pass.
- [ ] Creating a contact in the UI navigates to `/contacts/:id` and the DTO endpoint returns the created values.
- [ ] Three verification passes complete clean.
