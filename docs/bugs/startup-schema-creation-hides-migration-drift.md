# Startup schema creation hides database migration drift

**Status:** Complete
**Source:** `docs/code-quality-audit.md` - High finding, "Backend schema management is startup magic"
**Spec:** L2-070 requires EF Core migrations
**Severity:** High (production rollout and schema review risk)

## Symptom

`backend/RecallQ.Api/Program.cs` creates and mutates the database during
application startup:

```csharp
await db.Database.EnsureCreatedAsync();
await db.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS vector;");
await db.Database.ExecuteSqlRawAsync("""
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at ...
    CREATE TABLE IF NOT EXISTS password_reset_tokens ...
    """);
await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS ix_contact_embeddings_vector ...");
await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS ix_interaction_embeddings_vector ...");
```

There is no `Migrations/` directory under `backend/RecallQ.Api`.
Startup catches schema/index exceptions and logs warnings, so the app can
continue after a partial initialization failure.

## Expected

Schema changes are explicit and reviewable. Per L2-070, the database
shape is managed by EF Core migrations, or by a single intentional
idempotent SQL migration path with production failure semantics.

Production startup should fail fast if required schema initialization
fails.

## Actual

The app relies on `EnsureCreatedAsync` plus ad hoc SQL in `Program.cs`.
Errors are logged and skipped.

## Repro

1. Run `rg -n "EnsureCreatedAsync|ExecuteSqlRawAsync" backend/RecallQ.Api`.
2. Run `Get-ChildItem -Recurse backend/RecallQ.Api -Directory -Filter Migrations`.
3. Observe runtime schema creation and no migration directory.

## Notes

Radically simple fix:

- Add an auditable migration path for the current schema, pgvector
  extension, password reset table, and HNSW indexes.
- Restrict `EnsureCreatedAsync` to tests or explicit local throwaway
  mode.
- In production, fail startup when schema initialization cannot complete.
