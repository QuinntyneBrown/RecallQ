# PATCH contact's email/phone change doesn't trigger re-embedding

**Flow:** 08 — Update Contact (intersecting flow 32 — Embedding Pipeline)
**Severity:** Medium-High (semantic search becomes stale on every email edit; the user adds `john@stripe.com`, the embedding still references the old emails forever)
**Status:** Complete — `ContactsEndpoints` PATCH now flips `needsEmbedding = true` for both `req.Emails` and `req.Phones`, mirroring the existing tags branch. Worker's hash+model idempotency keeps no-op patches free. New acceptance test `PatchContactEmailsTriggersEmbedTests` creates a contact, snapshots the captured-job count, PATCHes emails, and asserts a new embedding job lands on the channel for that contact.

## Symptom

`backend/RecallQ.Api/Endpoints/ContactsEndpoints.cs` PATCH handler:

```csharp
var needsEmbedding = false;
if (req.Starred.HasValue) c.Starred = req.Starred.Value;
if (req.Emails is not null) c.Emails = req.Emails;
if (req.Phones is not null) c.Phones = req.Phones;
if (req.DisplayName is not null) { c.DisplayName = req.DisplayName.Trim(); needsEmbedding = true; }
if (req.Initials is not null) { c.Initials = req.Initials.Trim(); }
if (req.Role is not null) { c.Role = req.Role.Trim(); needsEmbedding = true; }
if (req.Organization is not null) { c.Organization = req.Organization.Trim(); needsEmbedding = true; }
if (req.Location is not null) { c.Location = req.Location.Trim(); needsEmbedding = true; }
if (req.Tags is not null) { c.Tags = req.Tags; needsEmbedding = true; }

await db.SaveChangesAsync();
if (needsEmbedding)
    await embeddingWriter.WriteAsync(new EmbeddingJob(c.Id, current.UserId!.Value, "contact"));
```

`needsEmbedding` flips for `displayName`, `role`, `organization`, `location`, and `tags` — but **not** for `emails` or `phones`. The contact entity is updated with the new emails / phones, then `SaveChangesAsync` commits, then the embedding job is *not* enqueued.

`backend/RecallQ.Api/Embeddings/EmbeddingWorker.cs` building the source text for a contact:

```csharp
sourceText = $"{c.DisplayName}\n{c.Role ?? ""} · {c.Organization ?? ""}\n{c.Location ?? ""}\nTags: {string.Join(", ", c.Tags)}\nEmails: {string.Join(", ", c.Emails)}";
```

`Emails` is part of the source text — the hash and the resulting embedding both depend on it. So when a user adds, removes, or replaces an email, the live entity reflects the new emails, but the cached embedding row keeps the old hash and the old vector. Vector search using the new email content does not match. Until something else mutates an embedded text field, the embedding silently rots.

The flow's spec is explicit:

> 5. A diff over the embedded text fields is computed. If any changed, an `EmbeddingJob { contactId }` is written to the channel so the worker regenerates the vector (flow 32).

`emails` is an embedded text field in the worker's source. The PATCH path missed it.

(Phones aren't in the worker's source text today, so missing the trigger on `phones` isn't observable in semantic search — but it's the same bug shape and equally easy to set right while the file is open.)

## Expected

`needsEmbedding` flips when `req.Emails is not null` (and arguably when `req.Phones is not null`, for symmetry and future-proofing if phones ever join the source text). Mirrors the existing condition for `tags`.

```csharp
if (req.Emails is not null) { c.Emails = req.Emails; needsEmbedding = true; }
if (req.Phones is not null) { c.Phones = req.Phones; needsEmbedding = true; }
```

The worker's idempotency check (`hash + model + !failed → skip`) means a no-op email patch (replacing an array with itself) costs zero LLM calls — the worker computes the same hash and short-circuits. So the trigger is cheap.

## Actual

`needsEmbedding` stays `false` on email changes; no job is enqueued; the embedding row keeps the old hash. Search misses the new email content.

## Repro

1. Create contact "Avery" with `emails: ["avery@old.com"]`. Wait for the worker to produce the initial embedding; record its `content_hash`.
2. PATCH the contact with `{ emails: ["avery@stripe.com"] }`. Wait briefly.
3. Re-read the contact embedding row. `content_hash` is unchanged from step 1; the vector is the old vector.
4. Search for `"stripe"` → Avery doesn't surface despite the new email mentioning it. (Or, more directly, observe `recallq_embedding_latency_seconds_count` — no new sample after the PATCH.)

## Notes

Radically simple fix — flip `needsEmbedding` on the email/phone branches, just like the tags branch already does. A regression test asserts that PATCHing emails enqueues exactly one embedding job on the channel.
