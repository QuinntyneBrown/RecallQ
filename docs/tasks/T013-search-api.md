# T013 — Vector Search API

| | |
|---|---|
| **Slice** | [08 Vector search API](../detailed-designs/08-vector-search-api/README.md) |
| **L2 traces** | L2-014, L2-015, L2-016, L2-019, L2-020, L2-055, L2-063, L2-071 |
| **Prerequisites** | T011 |
| **Produces UI** | No |

## Objective

Ship `POST /api/search` returning ranked contacts (best-source-per-contact, collapsed). Uses a single raw SQL CTE over `contact_embeddings UNION interaction_embeddings`, with `DISTINCT ON (contact_id) ORDER BY similarity DESC`.

## Scope

**In:**
- Endpoint handler using `ctx.Database.SqlQuery<Row>`.
- Request validation: non-empty `q`, length ≤ 500.
- Rate limit `search` 60/min/user (L2-055).
- `matchedText` truncation to 240 chars on word boundary.
- Search request omits `q` from logs — only logs `queryLength` + `queryHash` (L2-071).

**Out:**
- UI (T014).

## ATDD workflow

1. **Red** (use a seeded fixture with `FakeEmbeddingClient` so similarities are deterministic):
   - `Search_returns_ranked_results_with_scores` (L2-014).
   - `Search_collapses_to_best_per_contact` (L2-015).
   - `Search_picks_interaction_over_contact_when_higher_similarity` (L2-015).
   - `Search_empty_q_400` (L2-020).
   - `Search_no_data_returns_200_empty` (L2-020).
   - `Search_matched_text_truncated_to_240_on_word_boundary` (L2-016).
   - `Search_61st_per_minute_returns_429` (L2-055).
   - `Search_query_absent_from_logs` (L2-071).
2. **Green** — implement handler + CTE.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The SQL is one string in one method — no dynamic assembly from helper classes.
- [ ] `SearchEndpoints.cs` ≤ 100 lines.
- [ ] `EXPLAIN ANALYZE` shows the HNSW index being used (recorded in a text fixture checked into repo for reference).

## Screenshot

Not applicable.

## Definition of Done

- [ ] 8 tests pass.
- [ ] Three verification passes complete clean.
