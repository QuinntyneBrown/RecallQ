# Suggestion dismiss is not optimistic

**Flow:** [25 — Proactive AI Suggestion](../flows/25-proactive-suggestion/25-proactive-suggestion.md)
**Traces:** L1-007, L2-029.
**Severity:** Medium — Flow 25 step 5 says "The SPA hides the card immediately", but the current implementation only clears the signal *after* the server returns `204`. On a slow connection the user taps Dismiss, sees no change, and is unsure if the action registered. If the POST fails entirely (or the user is offline), the card stays visible forever with no error feedback.

## Observed

`frontend/src/app/suggestions/suggestions.service.ts`:

```ts
async dismiss(key: string): Promise<void> {
  const res = await fetch(`/api/suggestions/${encodeURIComponent(key)}/dismiss`, {
    method: 'POST',
    credentials: 'include',
  });
  if (res.status === 204) this.suggestion.set(null);
}
```

`set(null)` only fires on a 204. Any other status — 500, 401 (now intercepted by my earlier 401-redirect fix), network failure — leaves the card on screen.

## Expected

Per Flow 25 step 5 + step 6 (idempotent dismiss): the SPA hides the card the moment the user taps Dismiss, then fires the POST best-effort. A retry on failure is unnecessary because the dismiss endpoint is idempotent on the server.

## Fix sketch

Reorder `dismiss()` so the local signal clears first, then the POST fires. Wrap the POST in a try/catch so a network failure can't leave the signal in a "still visible" state.

```ts
async dismiss(key: string): Promise<void> {
  this.suggestion.set(null);
  try {
    await fetch(`/api/suggestions/${encodeURIComponent(key)}/dismiss`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // best-effort — local state is already cleared
  }
}
```
