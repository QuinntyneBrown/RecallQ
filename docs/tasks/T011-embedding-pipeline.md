# T011 — Embedding Pipeline

| | |
|---|---|
| **Slice** | [07 Embedding pipeline](../detailed-designs/07-embedding-pipeline/README.md) |
| **L2 traces** | L2-078, L2-073, L2-071 |
| **Prerequisites** | T007, T009 |
| **Produces UI** | No |

## Objective

Ship the asynchronous embedding pipeline: `Channel<EmbeddingJob>` singleton, `EmbeddingWorker : BackgroundService`, `IEmbeddingClient` + `OpenAIEmbeddingClient`, and the `contact_embeddings` / `interaction_embeddings` tables with HNSW cosine indexes.

## Scope

**In:**
- `ContactEmbedding`, `InteractionEmbedding` entities + migration enabling `pgvector` and creating HNSW indexes on `(embedding vector_cosine_ops)`.
- `IEmbeddingClient`, `OpenAIEmbeddingClient` typed `HttpClient`, model `text-embedding-3-small` (1536 dims), model id exposed from the interface.
- `EmbeddingWorker` drains the channel, builds source text per §3.3 of the design, SHA256 hashes it, upserts into the right table.
- `FakeEmbeddingClient` for integration tests — deterministic vectors from text.

**Out:**
- Backfill / idempotency fine points (T012).
- Any UI.

## ATDD workflow

1. **Red**:
   - `Creating_contact_produces_embedding_row_within_30s` (L2-078).
   - `Source_text_never_appears_in_logs` (L2-071) — log-capturing `TestSink`.
   - `Transient_failure_retries_3_times_then_marks_failed` — `FlakyEmbeddingClient` throws twice then succeeds; or always throws to test the failed flag.
2. **Green** — implement entity, worker, clients, migration. Register `FakeEmbeddingClient` in the test factory.

## Playwright POM

N/A — backend only.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `EmbeddingWorker` uses `IServiceScopeFactory` correctly (per-job scope).
- [ ] The HNSW migration is idempotent (`CREATE EXTENSION IF NOT EXISTS vector`).
- [ ] No code concatenates raw secrets anywhere visible in logs.

## Screenshot

Not applicable.

## Definition of Done

- [x] All 3 tests pass against a real Postgres+pgvector from Testcontainers.
- [x] Creating a contact or interaction enqueues a job and results in a row with a non-null vector column.
- [x] Three verification passes complete clean.

**Status: Complete**
