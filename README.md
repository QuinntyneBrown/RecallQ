# RecallQ

Radically simple knowledge capture + semantic recall.

## Prerequisites

- .NET 9 SDK (or newer)
- Node.js 22+ and npm
- Docker Desktop / Docker Engine

## Quick start

```bash
# 1. Start PostgreSQL 16 with pgvector
docker compose up -d

# 2. Run the API (listens on http://localhost:5000 by default)
dotnet run --project backend/RecallQ.Api/RecallQ.Api.csproj

# 3. Run the Angular frontend (listens on http://localhost:4200)
cd frontend
npm install
ng serve
```

## Tests

```bash
dotnet test
```

The acceptance tests spin up a throwaway Postgres+pgvector container via
Testcontainers, so Docker must be running.

## Layout

- `backend/RecallQ.Api/` — ASP.NET Core minimal API + EF Core + pgvector.
- `tests/RecallQ.AcceptanceTests/` — xUnit acceptance tests.
- `frontend/` — Angular workspace.
- `docker-compose.yml` — local Postgres with pgvector.
