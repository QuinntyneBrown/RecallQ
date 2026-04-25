# Search rate-limit response shows raw `search_failed_429`

**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Traces:** L1-004, L2-014.
**Severity:** Low-Medium — Flow 15 alternatives call out 429 as a first-class case ("Over rate limit → 429 with `Retry-After`"). The SPA's search service has friendly messages for 400 and 503 but funnels 429 (and any other unhandled status) into the catch-all `'search_failed_' + status`, so the visitor sees `search_failed_429` literally in the results error band.

## Observed

`frontend/src/app/search/search.service.ts`:

```ts
if (res.status === 400) this.error.set('Invalid query');
else if (res.status === 503) this.error.set('Embeddings are being regenerated, try again shortly');
else this.error.set('search_failed_' + res.status);
```

## Expected

Per Flow 15 alternatives, a 429 should produce a rate-limit specific message — consistent with the friendly handling already shipped for `/api/auth/login` (`'Too many attempts. Try again in a minute.'`) and `/api/contacts/{id}/summary:refresh` (`'Refresh available in a minute'`). Suggest:

- 429 → `'Too many searches. Try again in a minute.'`
- Anything else → fall back to `'Search failed. Please try again.'` instead of the raw status string.

## Fix sketch

Extend the branch in `search.service.ts`:

```ts
if (res.status === 400) this.error.set('Invalid query');
else if (res.status === 429) this.error.set('Too many searches. Try again in a minute.');
else if (res.status === 503) this.error.set('Embeddings are being regenerated, try again shortly');
else this.error.set('Search failed. Please try again.');
```
