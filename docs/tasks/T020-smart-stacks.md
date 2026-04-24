# T020 — Smart Stacks

| | |
|---|---|
| **Slice** | [15 Smart Stacks](../detailed-designs/15-smart-stacks/README.md) |
| **L2 traces** | L2-026, L2-027, L2-028, L2-056 |
| **Prerequisites** | T013, T008 |
| **Produces UI** | Yes |

## Objective

Ship the Smart Stacks row on Home (`stacksRow` in the pen). New users get 3 default stacks (`AI founders` query, `Intros owed` classification, `Close friends` query). Counts computed on demand with a 5-minute in-memory cache. Tapping a stack card opens a filtered search.

## Scope

**In:**
- `Stack` entity + migration.
- Seed the 3 defaults on registration (hook from `POST /api/auth/register`).
- `GET /api/stacks` with counts (via either tag filter, semantic query, or classification evaluator).
- `GET /api/stacks/{id}/contacts` with ordering by kind.
- `StackCard` component + horizontal-scroll `stacksRow` on `HomePage`.
- Stack chip on `SearchResultsPage` when `?stackId=` is used.

**Out:**
- Stack CRUD UI (not in v1).

## ATDD workflow

1. **Red — API**:
   - `New_user_gets_3_default_stacks` (L2-026).
   - `Stack_with_zero_count_hidden` (L2-026) — list endpoint filters these.
   - `Tag_stack_count_reflects_membership` (L2-028).
   - `Query_stack_count_updates_after_cache_expires` (L2-028).
   - `Other_user_stacks_not_visible` (L2-056).
2. **Red — e2e**:
   - `T020-stacks.spec.ts` — seed contacts tagged `investor` → home → assert 3 stack cards with counts → tap `AI founders` → assert filtered list with stack name as chip.
3. **Green** — implement.

## Playwright POM

Extend `HomePage`:
```ts
stackCards() { return this.page.getByTestId('stack-card'); }
async tapStack(name: string) { await this.page.getByRole('link', { name }).click(); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Seeding 3 defaults on register is a single static list, not a factory per-stack.
- [ ] `StackCard` uses the design-defined accent stroke color at 40% alpha per card.
- [ ] Counts over 999 display as `999+` (optional but protects the Geist Mono big number layout).

## Screenshot

`docs/tasks/screenshots/T020-stacks.png` — Home page at 375×667 with the 3 stack cards visible in the smart-stacks row.

## Definition of Done

- [ ] 5 API tests + 1 e2e pass.
- [ ] Three verification passes complete clean.
