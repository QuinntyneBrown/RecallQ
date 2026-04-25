# Admin embedding status endpoint missing

**Flow:** 33 — Embedding Backfill (with pipeline 32)
**Severity:** Medium (operational visibility gap)
**Status:** Complete — `AdminEndpoints` now exposes `GET /api/admin/embeddings/status`. It reads the `ContactEmbeddings` and `InteractionEmbeddings` DbSets with `IgnoreQueryFilters` (justified per flow 36's "explicit admin utilities" carve-out), counts `Failed == true` rows on each, and returns `{ contactsFailed, interactionsFailed }`.

## Symptom

Flow 33 alternatives line:

> **Partial failures** → logged; `embedding_failed` rows are reported
> on the status endpoint.

Flow 32 alternatives line:

> **Permanent failure** → mark `embedding_failed = true`; the record
> is surfaced on an admin/status endpoint.

`backend/RecallQ.Api/Endpoints/AdminEndpoints.cs` exposes
`POST /api/admin/embeddings/backfill` and `POST /api/admin/detect-suggestions`,
but no status endpoint. The `Failed` flag on `ContactEmbedding` /
`InteractionEmbedding` is set when retries exhaust, but there's no
operator-facing surface that aggregates them. Operators have to
SSH into the database to know which records are stuck.

## Expected

A `GET /api/admin/embeddings/status` endpoint, gated by the same
`ADMIN_ENABLED` filter as the other admin endpoints, that returns
at minimum the count of failed contact and interaction embeddings:

```json
{ "contactsFailed": 3, "interactionsFailed": 0 }
```

This is the smallest meaningful surface; future work can add
sample rows / last errors.

## Actual

No status endpoint. Failed rows are invisible to admins.

## Repro

1. Configure `ADMIN_ENABLED=true`.
2. `curl http://localhost:5151/api/admin/embeddings/status` → `404`.

## Notes

Radically simple fix:

- Add a `MapGet("/embeddings/status")` to `AdminEndpoints` that
  uses `IgnoreQueryFilters` (justified per flow 36's "explicit
  admin utilities" carve-out), counts `Failed == true` rows from
  `ContactEmbeddings` and `InteractionEmbeddings`, and returns
  `{ contactsFailed, interactionsFailed }`.
