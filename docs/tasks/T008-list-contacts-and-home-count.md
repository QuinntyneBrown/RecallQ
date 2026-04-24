# T008 — List Contacts + Home Hero Count

| | |
|---|---|
| **Slice** | [04 List contacts](../detailed-designs/04-list-contacts/README.md) |
| **L2 traces** | L2-009, L2-081 |
| **Prerequisites** | T007 |
| **Produces UI** | Yes |

## Objective

Ship `GET /api/contacts` (paginated, sortable) and wire the Home hero subtitle to live values: `Semantic search across {N} contacts and {M} interactions.` where both counts come from the API (interactions count returns 0 until T009 exists). The Home page also ships the "Good morning, {name}" greeting, hero title (`Find anyone.` / `By meaning, not memory.`) and the search input as a navigation target (search itself arrives in T013/T014).

## Scope

**In:**
- `GET /api/contacts?page&pageSize&sort` handler (L2-009).
- `GET /api/contacts/count` helper endpoint — returns `{ contacts, interactions }` used by the home hero. Single-purpose, cheap, cacheable.
- `HomePage` Angular component at `/home` (protected route). Matches the top bar, hero, and the search input from `1. Vector Search Home` in the pen; the search input is a non-functional link that navigates to `/search?q=` in this task.

**Out:**
- Search itself (T013/T014).
- Suggestion chips row, AI suggestion card, smart stacks (later tasks).

## ATDD workflow

1. **Red — API**:
   - `List_returns_paged_results_with_totalCount` (L2-009).
   - `List_sort_name_returns_alphabetical` (L2-009).
   - `List_empty_returns_200_empty_items` (L2-009).
   - `Count_returns_contacts_and_interactions_totals` (L2-081).
2. **Red — e2e**:
   - `T008-home.spec.ts` — register + add 3 contacts via `flows/add-contact.flow.ts` (running the flow 3 times, or by using `seed-api.ts`), navigate to `/home`, assert the subtitle reads `Semantic search across 3 contacts and 0 interactions.`.
3. **Green** — implement list endpoint + count endpoint + Home layout.

## Playwright POM

`pages/home.page.ts`:
```ts
export class HomePage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/home'); }
  title()       { return this.page.getByRole('heading', { name: 'Find anyone.' }); }
  subtitle()    { return this.page.getByTestId('hero-subtitle'); }
  searchInput() { return this.page.getByRole('searchbox', { name: 'Search contacts' }); }
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The hero subtitle is a **single template binding** driven by signals — not string-concatenated in TS.
- [ ] Greeting segment ("Good morning, Quinn") reads from the `authState()` user profile (for now just email's local part).
- [ ] The search input uses the `Search Bar` component styles from `ui-design.pen` (id `lpCnN`): radius-full, 56px height, elevated surface.

## Screenshot

`docs/tasks/screenshots/T008-home.png` — Home page at 375×667 showing greeting, hero title, subtitle with live counts, and search bar.

## Definition of Done

- [x] 4 API tests + 1 e2e pass.
- [x] With 3 contacts seeded, the subtitle reads "3 contacts and 0 interactions".
- [x] Three verification passes complete clean.

**Status: Complete**
