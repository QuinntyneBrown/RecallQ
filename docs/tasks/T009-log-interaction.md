# T009 — Log Interaction

| | |
|---|---|
| **Slice** | [05 Log interaction](../detailed-designs/05-log-interaction/README.md) |
| **L2 traces** | L2-010, L2-012, L2-013, L2-056 |
| **Prerequisites** | T008 |
| **Produces UI** | Yes |

## Objective

Ship `POST /api/contacts/{id}/interactions`, `PATCH /api/interactions/{id}`, `DELETE /api/interactions/{id}`, and the Add Interaction page. Includes the interaction-type pill selector (Email / Call / Meeting / Note) matching `Ix *` components in `ui-design.pen`.

## Scope

**In:**
- `Interaction` entity + migration (enum column `interaction_type`).
- `Endpoints/InteractionsEndpoints.cs` with create / patch / delete.
- Create enqueues to `Channel<EmbeddingJob>` and to `Channel<SummaryRefreshJob>`.
- `AddInteractionPage` at `/contacts/:id/interactions/new`.

**Out:**
- Embedding generation (T011).
- Timeline rendering on contact detail (T010).
- Summary refresh (T019).

## ATDD workflow

1. **Red — API**:
   - `Log_interaction_persists_and_enqueues` (L2-010, L2-078).
   - `Invalid_type_returns_400` (L2-010).
   - `Content_over_8000_returns_400` (L2-010).
   - `Patch_interaction_re_enqueues_embedding` (L2-013).
   - `Delete_interaction_removes_embedding_row` (L2-013).
   - `Non_owner_cannot_patch_or_delete_404` (L2-056).
2. **Red — e2e** — `T009-log-interaction.spec.ts` seeds a user + contact, opens `/contacts/:id/interactions/new`, picks `Call`, enters content, submits; asserts navigation back to detail (the detail page will be stubbed until T010 — for T009 redirect to `/contacts/:id` which shows the DTO).
3. **Green** — implement entity + endpoints + form.

## Playwright POM

`pages/add-interaction.page.ts`:
```ts
export class AddInteractionPage {
  constructor(private page: Page) {}
  async goto(contactId: string) { await this.page.goto(`/contacts/${contactId}/interactions/new`); }
  async selectType(t: 'email' | 'call' | 'meeting' | 'note') {
    await this.page.getByRole('radio', { name: new RegExp(t, 'i') }).check();
  }
  async setContent(text: string) { await this.page.getByLabel('Content').fill(text); }
  async save() { await this.page.getByRole('button', { name: 'Save' }).click(); }
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The type selector uses `<input type="radio">` under the hood — not a raw `<div role="button">`. Accessibility first.
- [ ] Each type pill uses its matching `Ix {Type}` component styles; swapping the wrapper class to the wrong type renders the wrong icon (verified visually in a second e2e assertion).
- [ ] `InteractionsEndpoints.cs` is ≤ 90 lines; if longer, split unrelated concerns.

## Screenshot

`docs/tasks/screenshots/T009-log-interaction.png` — Add Interaction form at 375×667 with "Call" selected and content filled.

## Definition of Done

- [ ] 6 API tests + 1 e2e pass.
- [ ] Three verification passes complete clean.
