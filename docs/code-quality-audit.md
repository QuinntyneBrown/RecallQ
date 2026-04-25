# Code Quality and Radical Simplicity Audit

## Scope

This audit reviews the repository as it exists now, with emphasis on whether the implementation remains radically simple while still being reliable. It is based on static inspection of the backend, frontend, docs, and test harness. No test suite was executed as part of this audit.

Repository inventory from source files only:

| Area | Files | Lines |
| --- | ---: | ---: |
| Backend app | 67 | 2,969 |
| Backend acceptance tests | 36 | 3,486 |
| Frontend src | 64 | 4,871 |

## Overall Verdict

The repository mostly preserves the intended simple architecture: one ASP.NET Core API project, EF Core directly against PostgreSQL/pgvector, minimal API endpoints, Angular standalone components, Signals, and no NgRx, MediatR, repository, CQRS, or unit-of-work layer.

The biggest quality issue is not over-engineering. It is drift. Docs, tests, frontend services, and backend contracts disagree in several places. That drift makes the code less simple because a maintainer must remember hidden exceptions: raw `fetch` instead of the specified `HttpClient`, stale `src`/`web` paths, startup schema creation instead of migrations, and frontend calls to API routes that do not exist.

Radical simplicity status: partly met. The shape is simple, but several seams are surprising.

## Strengths

| Area | Assessment |
| --- | --- |
| Backend project shape | Meets the radical simplicity constraint. `backend/RecallQ.sln` has one app project plus one test project. |
| Backend data access | Endpoints and services use `AppDbContext` directly, with no repository abstraction. This is the right level of simplicity for this project. |
| Owner scoping | `OwnerScope.ConfigureOwnerScope` applies global query filters across owned entities, reducing repeated authorization predicates in handlers. |
| Security baseline | Cookie auth is HttpOnly, SameSite strict, rate limits exist for login/search/ask/summary/intro, Argon2id is used for password hashing, and structured logging is configured. |
| Frontend component model | Frontend components are standalone and use Signals for local/shared state. No NgRx-style global store is present. |
| Test investment | Backend acceptance tests and Playwright tests cover many product flows and bug regressions. The amount of test code exceeds app backend code, which is healthy for a compact app. |

## Findings

### High: E2E harness uses stale paths

`e2e/playwright.config.ts` starts the frontend from `../web` and the API from `../src/RecallQ.Api`, but the repository uses `frontend` and `backend/RecallQ.Api`.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `e2e/playwright.config.ts` | 38-45 | `cwd: '../web'` and `dotnet run --project ../src/RecallQ.Api` do not match the repository layout. |
| `docs/folder-structure.md` | 79-80 | The project-root section still documents `src/` and `web/`. |

Impact: Playwright cannot be trusted as a regression gate until the config and docs match the actual layout.

Recommendation: Change the web server cwd to `../frontend`, change the API project path to `../backend/RecallQ.Api/RecallQ.Api.csproj`, and update `docs/folder-structure.md`.

### High: Frontend API access violates the stated simple architecture

The requirements say frontend API calls should use Angular `HttpClient`. The app uses raw `fetch` across feature services and installs a global fetch monkey patch for 401 handling.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `frontend/src/app/app.config.ts` | 8-22 | No `provideHttpClient`; instead the app initializer installs a custom fetch interceptor. |
| `frontend/src/app/auth/api-interceptor.ts` | 1-19 | Replaces `window.fetch` globally. |
| `frontend/src/app/contacts/contacts.service.ts` | 76-145 | Uses raw `fetch` for every contact API operation. |
| `frontend/src/app/search/search.service.ts` | 46-84 | Uses raw `fetch` for search and pagination. |

Impact: The code is less predictable than Angular's built-in request pipeline. Global fetch replacement is hidden state, can affect tests, and makes per-request behavior harder to reason about.

Recommendation: Use `provideHttpClient` plus an Angular HTTP interceptor for normal JSON APIs. Keep raw `fetch` only where it is genuinely needed for streaming `/api/ask`, and isolate that exception inside `AskService`.

### High: Backend schema management is startup magic, not an auditable migration path

The API calls `EnsureCreatedAsync()` at startup and creates pgvector indexes with raw SQL in `Program.cs`. There are no EF migrations in the backend tree.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `backend/RecallQ.Api/Program.cs` | 155-165 | Startup creates the schema, extension, and HNSW indexes. |
| `backend/RecallQ.Api/Program.cs` | 167-174 | Schema/index failures are logged and skipped, allowing partial startup. |

Impact: This is convenient locally but unsafe as the schema evolves. It hides production rollout behavior, makes schema drift likely, and weakens reviewability of database changes.

Recommendation: Add migrations or a single explicit idempotent SQL migration path. Keep `EnsureCreated` only in tests or local throwaway mode, and fail fast in production if schema initialization fails.

### High: API/UI contracts are currently inconsistent

The frontend exposes delete-contact behavior, but the backend does not map `DELETE /api/contacts/{id}`. Contact update supports only `starred`, `emails`, and `phones`, while the requirements call for editable profile fields and re-embedding. The contact count endpoint always returns zero interactions.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `frontend/src/app/contacts/contacts.service.ts` | 137-145 | Calls `DELETE /api/contacts/{id}`. |
| `backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` | 30-114 | Maps post/get/patch/list/count only; no delete route. |
| `backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` | 76-89 | Patch only handles starred, emails, and phones. |
| `backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` | 110-114 | Returns `interactions = 0` regardless of stored interactions. |

Impact: The UI can present actions that cannot succeed, profile edits are incomplete, search embeddings can become stale after profile edits, and home-count UI data is wrong once interactions exist.

Recommendation: Add the missing delete route, complete the patch contract, enqueue contact re-embedding when embedded fields change, and count interactions from the database.

### Medium: Search pagination metadata is misleading

`contactsMatched` is currently set to `rows.Count`, which is the number of results in the current page, not the total number of contacts matching the query.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `backend/RecallQ.Api/Endpoints/SearchEndpoints.cs` | 79-93 | The SQL applies `LIMIT/OFFSET`, then the response reports `contactsMatched = rows.Count`. |
| `frontend/src/app/search/search.service.ts` | 52-57 | The UI stores that page count as the global matched count. |

Impact: The match count changes with page size and page position. This also weakens sort/pagination tests because the API metadata does not mean what the UI label says.

Recommendation: Return a separate total count from the collapsed hit set, or rename the field if the intent is page count. For the current UI, total count is the better contract.

### Medium: Production can silently fall back to fake AI clients

If `Embeddings:OpenAI:ApiKey` is empty, the app registers both `FakeEmbeddingClient` and `FakeChatClient`. That is good for local development only if it is explicit.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `backend/RecallQ.Api/Program.cs` | 82-90 | Empty OpenAI embedding key triggers fake embeddings and fake chat. |
| `backend/RecallQ.Api/appsettings.json` | 10-15 | The default key is empty. |

Impact: A production deployment with a missing key could appear healthy while returning fake AI behavior. That is simpler to run, but not simpler to diagnose.

Recommendation: Require an explicit `Embeddings:Provider=fake` in non-production. In production, fail fast when the configured real provider is missing required secrets.

### Medium: Requirements and tests have started to encode drift

The CSV import requirement says `201 Created`, but the endpoint returns `200 OK` and the acceptance test asserts `OK`.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `backend/RecallQ.Api/Endpoints/ImportEndpoints.cs` | 65-67 | Returns `Results.Ok(...)` after successful import. |
| `backend/RecallQ.AcceptanceTests/ImportTests.cs` | 69-74 | Asserts `HttpStatusCode.OK`. |
| `docs/specs/L2.md` | L2-077 | Requires `201 Created` for valid CSV upload. |

Impact: Tests are no longer purely protecting requirements; some now protect implementation drift. This makes the large test suite less useful as a source of truth.

Recommendation: Decide the desired API semantics, then align L2, endpoint, and tests in one small change.

### Low: Generated Angular scaffold files remain in source

`frontend/src/app/app.ts` uses an inline template and inline styles. `frontend/src/app/app.html` still contains the Angular starter placeholder and is not referenced by `templateUrl`.

Evidence:

| File | Lines | Issue |
| --- | --- | --- |
| `frontend/src/app/app.html` | 1-315 | Unused Angular starter template remains in the app folder. |
| `frontend/src/app/app.ts` | 12-92 | The real root component uses inline template/styles. |

Impact: Low runtime risk, but it increases repository noise and makes searches less accurate.

Recommendation: Delete unused scaffold files, or wire the component back to external template/style files if that is the preferred convention.

## Radical Simplicity Assessment

Keep these choices:

| Choice | Why it is simple |
| --- | --- |
| One backend app project | Avoids distributed-system complexity and premature layering. |
| Minimal APIs plus EF Core directly | Keeps request behavior close to the data it changes. |
| Channels for in-process background work | Fits the single-process constraint better than a message bus for this stage. |
| Angular standalone components and Signals | Keeps frontend state visible and local without a global store. |
| Feature folders with small services | Makes app behavior findable without DDD-style indirection. |

Tighten these choices:

| Choice | Simpler replacement |
| --- | --- |
| Global fetch monkey patch | Angular `HttpClient` interceptor for JSON APIs, raw fetch only for streaming. |
| Startup schema creation | Explicit migrations or one reviewed idempotent SQL path. |
| Stale docs and paths | Treat docs that describe commands/paths as executable maintenance surface. |
| Frontend calls to missing backend routes | Add contract checks or endpoint smoke tests for every frontend service method. |
| Silent fake AI fallback | Explicit fake provider in local/dev only; production fail-fast. |

## Recommended Remediation Order

1. Fix the E2E harness paths and stale folder-structure docs so the full UI regression suite can run.
2. Repair the contact API contract: add delete, complete patch, count interactions correctly, and enqueue re-embedding after profile text changes.
3. Convert normal frontend API services from raw `fetch` to `HttpClient`; keep the `/api/ask` streaming exception isolated.
4. Replace startup schema creation with an auditable migration path before adding more database shape.
5. Make fake AI clients explicit and impossible to select accidentally in production.
6. Align import status semantics across L2, implementation, and tests.
7. Remove dead Angular scaffold files and add a small stale-path check for `../src`, `../web`, `src/`, and `web/` references in operational docs/config.

## Bottom Line

The codebase is close to the intended architecture, but it is not yet radically simple in day-to-day maintenance. The simple path is to reduce surprises: one real API client strategy, one real schema-change strategy, docs that match the filesystem, tests that match requirements, and no frontend call without a backend route.
