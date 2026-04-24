# T001 — Initialize Solution

| | |
|---|---|
| **Slice** | [01 Architecture skeleton](../detailed-designs/01-architecture-skeleton/README.md) |
| **L2 traces** | L2-072, L2-073, L2-074, L2-075 |
| **Prerequisites** | none |
| **Produces UI** | No |

## Objective

Stand up the radically-simple skeleton: one `RecallQ.Api` .NET project, one Angular workspace, one `docker-compose.yml` that brings up PostgreSQL 16 with the `pgvector` extension, and an acceptance-test project. Nothing else — no domain model, no endpoints beyond what T004 adds.

## Scope

**In:**
- `src/RecallQ.Api/RecallQ.Api.csproj` (net9.0), `Program.cs` < 50 lines.
- `src/RecallQ.Api/AppDbContext.cs` — empty class, `UseNpgsql().UseVector()`.
- `tests/RecallQ.AcceptanceTests/RecallQ.AcceptanceTests.csproj` (xUnit + Microsoft.AspNetCore.Mvc.Testing + Testcontainers.PostgreSql).
- `web/` — Angular workspace created with `ng new --standalone --routing --style=css`.
- `docker-compose.yml` at repo root running `ankane/pgvector:v0.8.0` on port 5432 with a seeded database.
- Root-level `README.md` updates explaining how to `docker compose up`, `dotnet run`, `ng serve`.

**Out:**
- Any endpoint beyond what T004 requires.
- Any Angular routes or components beyond the generated skeleton.
- CI configuration (separate later task).

## ATDD workflow

1. **Red** — add `SolutionTests.cs` to the acceptance test project:
   ```csharp
   // Traces to: L2-072, L2-073
   // Task: T001
   public class SolutionSmokeTests : IClassFixture<RecallqFactory> {
       [Fact] public async Task Db_is_reachable_and_pgvector_is_enabled() { ... }
       [Fact] public async Task Solution_contains_exactly_one_api_project() { ... }
       [Fact] public async Task No_forbidden_packages_are_referenced() { ... } // MediatR, AutoMapper, NgRx refs (via file scan)
   }
   ```
2. **Green** — scaffold the solution so the tests pass.
3. **Refactor** — remove anything the template added that is not used (`WeatherForecast`, `appsettings.Development.json` defaults, etc.).

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks for this task on each pass:
- [ ] `src/` contains exactly one `.csproj` for the API.
- [ ] `grep -R "MediatR\|AutoMapper\|Repository<\|UnitOfWork\|@ngrx" src/ web/` returns no matches.
- [ ] `Program.cs` is under 50 lines.

## Screenshot

Not applicable for this task (no UI rendered yet).

## Definition of Done

- [x] `docker compose up` starts Postgres with `pgvector` available.
- [x] `dotnet test` runs the 3 smoke tests green.
- [x] `ng serve` starts the Angular app on port 4200.
- [x] Three verification passes complete with every box checked in one sweep.

**Status: Complete**
