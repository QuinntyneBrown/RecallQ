# T012 — Embedding Idempotency + Backfill Admin

| | |
|---|---|
| **Slice** | [07 Embedding pipeline](../detailed-designs/07-embedding-pipeline/README.md) |
| **L2 traces** | L2-079, L2-080 |
| **Prerequisites** | T011 |
| **Produces UI** | No |

## Objective

Harden the pipeline: embedding upserts are idempotent on `(sourceHash, modelId)`, and an admin-gated `POST /api/admin/embeddings/backfill` replays all rows into the queue in batches.

## Scope

**In:**
- Upsert logic: skip when an existing row for the same source has matching `modelId` + `sourceHash`.
- Backfill endpoint iterating `contacts` and `interactions` in chunks of 500, enqueuing jobs. Gated by env var `ADMIN_ENABLED=true`.
- Resumability: a `backfill_cursor` row keyed by `(owner_user_id, table)` advanced after each chunk.
- `503 Service Unavailable` on search (tie-in with T013) when majority of rows do not match the current model — signal that a backfill is running.

**Out:**
- Admin UI — CLI / curl only.

## ATDD workflow

1. **Red**:
   - `Re_embedding_same_content_is_idempotent` (L2-078 / L2-079).
   - `Backfill_resumes_from_cursor_without_duplicates` (L2-079).
   - `Search_returns_503_when_model_mismatch_majority` (L2-080).
2. **Green** — implement idempotency + backfill + 503.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The backfill endpoint returns `202` immediately and does its work on the background worker.
- [ ] No new abstraction layer was introduced; backfill code lives in `AdminEndpoints.cs`, ≤ 60 lines.

## Screenshot

Not applicable.

## Definition of Done

- [x] 3 tests pass.
- [x] Running the backfill on a seeded 10k-row dataset completes without duplicate rows when interrupted and restarted.
- [x] Three verification passes complete clean.

**Status: Complete**
