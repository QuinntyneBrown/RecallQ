# Folder Structure

## Backend — `backend/RecallQ.Api/`

```
backend/RecallQ.Api/
├── Entities/               Domain models mapped to database tables (User, Contact, Interaction, etc.)
├── Endpoints/              Minimal API route handlers, one subfolder per feature area
│   ├── Admin/              Admin-only routes (user management, system ops)
│   ├── Ask/                AI-powered question-answering routes
│   ├── Auth/               Login, register, logout routes
│   ├── Contacts/           CRUD routes for contacts
│   ├── Import/             CSV import routes
│   ├── Interactions/       Interaction log routes
│   ├── Search/             Semantic search routes
│   ├── Stacks/             Stack management routes
│   ├── Suggestions/        Suggestion retrieval routes
│   └── Summaries/          Relationship summary routes
├── Chat/                   LLM chat client abstraction and OpenAI integration
├── Embeddings/             Embedding generation, storage, and backfill pipeline
├── Security/               Auth middleware, current-user accessor, password hashing
├── Stacks/                 Stack business logic and services
├── Suggestions/            Suggestion generation services
├── Summaries/              Relationship summary generation services
├── Observability/          Logging setup, Prometheus metrics, health check registrations
├── AppDbContext.cs         EF Core DbContext — all DbSets and model configuration
└── Program.cs              App entry point — DI registrations, middleware pipeline, route mapping
```

**What goes where:**
- New domain models → `Entities/`
- New API routes → new subfolder under `Endpoints/` with a static class per HTTP method group
- New external service integration → new top-level feature folder (e.g., `Notifications/`)
- Cross-cutting infrastructure (logging, auth, metrics) → `Observability/` or `Security/`

---

## Frontend — `frontend/src/app/`

```
frontend/src/app/
├── pages/                  Route-level smart components, one subfolder per page
│   ├── ask/                Ask / chat page
│   ├── contact-detail/     Contact profile and interaction history
│   ├── home/               Dashboard / feed
│   ├── add-contact/        New contact form
│   ├── add-interaction/    Log interaction form
│   ├── import/             CSV import page
│   ├── login/              Auth login page
│   ├── logout/             Logout confirmation
│   ├── register/           Registration page
│   └── search/             Semantic search results page
├── auth/                   Auth service, HTTP interceptor, route guards
├── chat/                   Chat message components and state
├── contacts/               Contact list, card, and service
├── interactions/           Interaction list and service
├── intros/                 Draft introduction components and service
├── search/                 Search bar component and service
├── stacks/                 Stack list, card, and service
├── suggestions/            Suggestion strip and service
├── imports/                Import wizard components and service
├── shared/                 Utilities and directives used across multiple features
└── ui/                     Pure presentational components (buttons, badges, dialogs, etc.)
```

**What goes where:**
- New page → new subfolder under `pages/` with its own component and route declaration
- New feature with multiple components + a service → new top-level feature folder (e.g., `notifications/`)
- Reusable presentational component with no business logic → `ui/`
- Utility pipes, directives, or helpers used by ≥2 features → `shared/`
- HTTP service tied to a single feature → lives inside that feature's folder

---

## Project Root

```
RecallQ/
├── src/                    Backend source (RecallQ.Api)
├── web/                    Frontend source (Angular app)
├── tests/                  xUnit acceptance tests (Testcontainers, real Postgres)
├── e2e/                    Playwright end-to-end tests
├── docs/                   Design files, specs, ADRs, and this document
├── docker/                 Postgres init scripts
├── docker-compose.yml      Local dev environment (Postgres + pgvector)
└── RecallQ.sln             Visual Studio solution
```
