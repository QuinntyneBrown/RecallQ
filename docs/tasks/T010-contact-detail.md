# T010 — Contact Detail with Timeline

| | |
|---|---|
| **Slice** | [06 Contact detail view](../detailed-designs/06-contact-detail-view/README.md) |
| **L2 traces** | L2-006, L2-011, L2-034, L2-035, L2-036, L2-083 |
| **Prerequisites** | T007, T009 |
| **Produces UI** | Yes |

## Objective

Ship `GET /api/contacts/{id}` returning `ContactDetailDto` (identity + first N interactions). Build `ContactDetailPage` matching `3. Contact Detail` frame in `ui-design.pen`: gradient hero, top bar (back / star / more), 96×96 avatar, name/role, tag chips, and the Recent Activity timeline with "See all N". Excludes the Relationship Summary card (T019) and the 4 quick-action tiles (T022–T024) — render these as placeholders.

## Scope

**In:**
- `GET /api/contacts/{id}?take=3` returning `ContactDetailDto`.
- `PATCH /api/contacts/{id}` for star toggling (first use — simple binding to `Starred`).
- `ContactDetailPage` with the structure above.
- `TimelineItem` component rendering `Ix {Type}` icons and relative-time short form per L2-012.

**Out:**
- Summary card (T019).
- Quick actions (T022–T024).
- Full activity screen "See all" (later task, not listed).

## ATDD workflow

1. **Red — API**:
   - `Get_contact_returns_detail_with_recent_interactions` (L2-006, L2-011).
   - `Get_contact_owned_by_another_user_returns_404` (L2-006).
   - `Patch_contact_starred_true_persists` (L2-083).
2. **Red — e2e**:
   - `T010-contact-detail.spec.ts` — seed contact with 5 interactions; open detail; assert hero content; assert 3 timeline items visible and "See all 5"; tap star; assert icon filled.
3. **Green** — implement endpoint and page.

## Playwright POM

`pages/contact-detail.page.ts`:
```ts
export class ContactDetailPage {
  constructor(private page: Page) {}
  async goto(id: string) { await this.page.goto(`/contacts/${id}`); }
  heroName()    { return this.page.getByTestId('hero-name'); }
  heroRole()    { return this.page.getByTestId('hero-role'); }
  tags()        { return this.page.getByTestId('hero-tags').getByRole('listitem'); }
  timelineItems() { return this.page.getByTestId('timeline').getByRole('listitem'); }
  seeAllLink()  { return this.page.getByRole('link', { name: /See all \d+/ }); }
  starButton()  { return this.page.getByRole('button', { name: 'Star contact' }); }
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The hero gradient is one CSS `background: linear-gradient(...)` matching the `heroBg` / `cNcxs` gradient stops from the pen — not an image.
- [ ] Star icon color uses `#FFB23D` when filled (matching the design) via a token or explicit CSS variable in the hero.
- [ ] `ContactDetailDto` does not include a full list of interactions — only up to `take`.

## Screenshot

`docs/tasks/screenshots/T010-contact-detail.png` — detail page at 375×667 with a starred contact and 3 timeline items.

## Definition of Done

- [x] 3 API tests + 1 e2e pass.
- [x] Detail hero renders gradient, avatar, name, role, tags.
- [x] Timeline shows up to 3 items at XS with "See all N".
- [x] Three verification passes complete clean.

**Status: Complete**
