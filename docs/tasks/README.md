# RecallQ — Implementation Tasks

This folder contains one markdown file per **task**. Each task is a small, vertically-sliced unit of work that implements part of the corresponding detailed design in [`../detailed-designs/`](../detailed-designs/00-index.md) and is testable via ATDD.

## Conventions

Every task file follows the same template:

1. **Metadata** — id, title, slice traces, L2 traces, prerequisites.
2. **Objective** — one-paragraph statement of what ships when this task is done.
3. **Scope** — explicit in/out list to keep the task small.
4. **ATDD workflow** — the strict order: **failing acceptance test → red → implement → green**. No code is written before a failing test exists.
5. **Playwright POM work** — for any task that produces UI: the page objects to add or update under `e2e/pages/`, and the spec under `e2e/tests/`.
6. **Verification loop (×3)** — a single checklist executed three consecutive times. If any check fails on any pass, fix and restart the loop at pass 1. See [Verification template](#verification-template) below.
7. **Screenshot** — a Playwright screenshot of the running feature in a real browser, saved to `docs/tasks/screenshots/T0XX-<slug>.png`.
8. **Definition of Done** — binary checks that must all be true before closing the task.

Every acceptance and e2e test file must start with the traceability comment header:

```ts
// Traces to: L2-014, L2-017
// Task: T014
```

```csharp
// Traces to: L2-005
// Task: T007
```

## Playwright POM structure

```
e2e/
├── playwright.config.ts
├── pages/
│   ├── app-shell.page.ts
│   ├── auth.page.ts
│   ├── home.page.ts
│   ├── add-contact.page.ts
│   ├── contact-detail.page.ts
│   ├── search-results.page.ts
│   ├── ask-mode.page.ts
│   ├── import.page.ts
│   └── modals/
│       ├── add-email.modal.ts
│       ├── add-phone.modal.ts
│       └── intro.modal.ts
├── flows/
│   ├── register.flow.ts
│   ├── add-contact.flow.ts
│   ├── log-interaction.flow.ts
│   └── search.flow.ts
├── fixtures/
│   ├── seed-api.ts          ← calls API directly to arrange data
│   ├── screenshot.ts        ← helper: await screenshot(page, 'T014-search-results')
│   └── viewports.ts         ← XS/SM/MD/LG/XL presets
└── tests/
    └── T0XX-<slug>.spec.ts
```

**Rules:**
- Page objects expose **semantic methods** (`await home.startSearch('investors')`) not raw selectors in tests.
- Selectors inside page objects prefer `page.getByRole`, `page.getByLabel`, `page.getByTestId` — in that order.
- `data-testid` attributes are used only where role/label-based queries cannot uniquely identify an element.
- Each spec file owns one task and includes exactly one `await screenshot(page, 'T0XX-<slug>')` at the end of the happy-path test.

## Verification template

Copy this block verbatim into each task's "Verification loop" section and walk it three consecutive times.

```markdown
Pass 1:
- [ ] **Radically simple** — Implementation follows the radical-simplicity rules
      (single API project, minimal APIs or thin controllers, EF Core directly,
      no MediatR/CQRS/Repository<T>, Angular standalone + Signals, no NgRx,
      handler file ≤ 120 lines, one feature per endpoints file). Anything that
      violates this is removed or justified in the task's Open Questions.
- [ ] **Requirements** — For each L2 ID traced by this task, the behavior matches
      every `Given/When/Then` criterion in `docs/specs/L2.md`.
- [ ] **UI design** — Every visual surface produced references exact nodes in
      `docs/ui-design.pen`. Spacing / typography / colors / corner radii /
      shadows / gradients match within the tolerances in L2-041 and L2-049.

Pass 2: repeat Pass 1 from scratch.

Pass 3: repeat Pass 1 from scratch.

If any box is unchecked on any pass, correct the issue and restart at Pass 1.
```

The three passes are not a formality — drift is routinely caught on pass 2 or 3. Keep going until a pass completes with every box checked in a single sweep.

## Screenshot convention

Every task that produces a UI surface ends with a screenshot step:

```ts
// In the spec, after the happy-path assertions:
await screenshot(page, 'T014-search-results', { fullPage: true });
```

`screenshot()` (in `e2e/fixtures/screenshot.ts`):
- resolves the file path to `docs/tasks/screenshots/<name>.png`
- always captures at viewport 390×844 for mobile-default tasks; responsive tasks capture at each viewport they cover (suffix with `-xs`, `-sm`, `-md`, `-lg`, `-xl`)
- fails loudly if `docs/tasks/screenshots/` is not writable

Tasks that do **not** produce UI (pure backend or infra) are exempt. They are labelled `No UI` in their metadata and skip the screenshot step.

## Task list

Tasks are numbered in dependency order. A task cannot start until all its prerequisites are complete.

### Foundation
- [T001](T001-initialize-solution.md) — Initialize solution (.NET API + Angular + Docker Compose + pgvector)
- [T002](T002-playwright-pom-harness.md) — Playwright POM harness
- [T003](T003-tokens-and-mobile-shell.md) — Design tokens + mobile shell chrome
- [T004](T004-ping-and-health.md) — Ping endpoint + health check

### Authentication
- [T005](T005-auth-register-login-api.md) — Register + login API
- [T006](T006-auth-logout-and-ui.md) — Logout + register/login pages

### Contacts
- [T007](T007-create-contact.md) — Create contact API + page
- [T008](T008-list-contacts-and-home-count.md) — List contacts API + home hero count

### Interactions and detail
- [T009](T009-log-interaction.md) — Log interaction API + page
- [T010](T010-contact-detail.md) — Contact detail page with timeline

### Embeddings and search
- [T011](T011-embedding-pipeline.md) — Embedding worker + OpenAI client *(No UI)*
- [T012](T012-embedding-idempotency-and-backfill.md) — Idempotency + backfill admin *(No UI)*
- [T013](T013-search-api.md) — Search API with HNSW CTE *(No UI)*
- [T014](T014-search-results-ui.md) — Search results page with tiers
- [T015](T015-search-sort-and-pagination.md) — Sort + infinite scroll

### Ask mode
- [T016](T016-ask-streaming.md) — Ask SSE endpoint + chat UI
- [T017](T017-ask-citations.md) — Citation mini-cards
- [T018](T018-ask-followups.md) — Follow-up suggestion chips
- [T019](T019-relationship-summary.md) — Summary worker + UI card

### Home surfaces
- [T020](T020-smart-stacks.md) — Smart Stacks row
- [T021](T021-proactive-suggestion.md) — AI suggestion card

### Quick actions
- [T022](T022-quick-actions-message-call.md) — Message + Call tiles
- [T023](T023-intro-draft.md) — Intro draft modal
- [T024](T024-ask-from-contact.md) — Ask AI from contact

### Data import
- [T025](T025-csv-bulk-import.md) — CSV import page

### Responsive
- [T026](T026-responsive-sm-md.md) — SM + MD shells
- [T027](T027-responsive-lg-xl.md) — LG + XL two-pane / three-pane

### Cross-cutting
- [T028](T028-security-rate-limit-headers.md) — Rate limits + security headers *(No UI)*
- [T029](T029-security-validation-and-isolation.md) — Validation + owner-scope + secrets *(No UI)*
- [T030](T030-observability.md) — Correlation IDs + metrics *(No UI)*
- [T031](T031-accessibility.md) — Focus, ARIA, contrast, axe

### End-to-end flow coverage
- [T032](T032-e2e-register-add-search-detail.md) — Golden path: register → add contact → search → detail
- [T033](T033-e2e-log-interaction-summary.md) — Log interaction → summary refreshes
- [T034](T034-e2e-ask-citations-followups.md) — Ask mode citations + follow-ups
- [T035](T035-e2e-responsive-sweep.md) — Responsive sweep across viewports
