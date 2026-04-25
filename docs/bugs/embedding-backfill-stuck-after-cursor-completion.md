# Embedding backfill is permanently stuck after a cursor completes once

**Flow:** 33 — Embedding Backfill (and 32 — Embedding Pipeline)
**Severity:** Medium-High (a second model upgrade leaves the API serving `503 Embeddings are being regenerated` indefinitely; the user can't run search until ops manually deletes the cursor row)
**Status:** Open

## Symptom

`backend/RecallQ.Api/Embeddings/EmbeddingBackfillRunner.cs`:

```csharp
private async Task ProcessTableAsync(Guid ownerUserId, string table, CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cursor = await db.BackfillCursors.FirstOrDefaultAsync(x => x.OwnerUserId == ownerUserId && x.Table == table, ct);
        if (cursor is null)
        {
            cursor = new BackfillCursor { … };
            db.BackfillCursors.Add(cursor);
            await db.SaveChangesAsync(ct);
        }
        if (cursor.Completed) return;
        …
        if (count < ChunkSize) cursor.Completed = true;
        await db.SaveChangesAsync(ct);
        if (cursor.Completed) return;
    }
}
```

Once a backfill finishes (`cursor.Completed = true`), the row stays that way forever. `BackfillCursor` has no `Model` field, no reset mechanism, and `_running.TryAdd / TryRemove` only guards against duplicate concurrent backfills — it doesn't reset cursor state.

The user-visible chain of events:

1. Initial deploy uses embedding model `M1`. All embeddings carry `model = "M1"`.
2. Ops upgrades the embedding provider; the worker now reports `_client.Model = "M2"`.
3. A search request lands. `SearchEndpoints` evaluates `(ceMatch + ieMatch) * 2 < total` (where `*Match` is rows whose `model = "M2"`). With no `M2` rows yet, the condition is true, so the endpoint kicks off `runner.StartInBackground(userId)` and returns `503`.
4. `ProcessTableAsync` for `"contacts"` loads the cursor — already `Completed = true` from a previous backfill (e.g., the original `M1` backfill, or a prior model upgrade). It returns immediately. **No `EmbeddingJob` is written.**
5. `EmbeddingWorker` sits idle. No `M2` rows are produced.
6. Subsequent search requests repeat step 3 indefinitely. Each one starts a no-op task. The user can never search again until ops manually deletes the cursor row from the database.

`POST /api/admin/embeddings/backfill` has the same shape — it calls `runner.StartInBackground(userId)` and returns `Accepted`, but the run does nothing under the same conditions.

## Expected

When `StartInBackground` is invoked for a user whose cursor is already `Completed = true`, the runner should treat it as a fresh backfill: reset `LastProcessedCreatedAt`, `LastProcessedId`, `Completed = false`, bump `StartedAt` and `UpdatedAt`. The next chunk loop will then enumerate every row again, so post-model-change rows get re-embedded by the worker (which already short-circuits on hash + model match for rows that *do* still have a current-model embedding).

The natural place is at the top of `ProcessTableAsync`, after loading the cursor: if `cursor.Completed` is true, log + reset rather than `return`.

## Actual

Once `Completed`, always `Completed`. The stuck-state requires manual DB intervention to recover.

## Repro

1. Seed a contact (`M1` embedding lands in `contact_embeddings.model = "M1"`).
2. POST `/api/admin/embeddings/backfill` — cursor advances to `Completed = true`.
3. Swap the worker's embedding model to `"M2"` (test fixture trick: replace `IEmbeddingClient.Model`).
4. POST `/api/admin/embeddings/backfill` again.
5. Observe: `BackfillCursor.Completed` stays `true`; `LastProcessedCreatedAt` doesn't change; the worker never receives any new job; the contact's embedding row stays at `model = "M1"`.

## Notes

Radically simple fix in `ProcessTableAsync`:

```csharp
var cursor = await db.BackfillCursors.FirstOrDefaultAsync(x => x.OwnerUserId == ownerUserId && x.Table == table, ct);
if (cursor is null)
{
    cursor = new BackfillCursor { … };
    db.BackfillCursors.Add(cursor);
    await db.SaveChangesAsync(ct);
}
else if (cursor.Completed)
{
    cursor.LastProcessedCreatedAt = default;
    cursor.LastProcessedId = default;
    cursor.Completed = false;
    cursor.StartedAt = DateTime.UtcNow;
    cursor.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);
}
```

The worker's hash-+-model idempotency check still short-circuits unchanged rows, so a "useless" reset of an already-current cursor is cheap — every contact gets re-enumerated, but the worker emits zero LLM calls. The stuck-state breaks; recovery is automatic.

Acceptance test: replace the worker's `IEmbeddingClient.Model` between two `runner.RunAsync` calls and assert that the second run flips the cursor back to in-progress and produces an embedding row whose `model` matches the new client model.
