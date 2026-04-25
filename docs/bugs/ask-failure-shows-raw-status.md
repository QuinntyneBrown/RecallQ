# Ask failure surfaces raw `ask_failed_<status>` strings

**Status:** Complete — `AskService.send` now branches on 429 / 400 / other and writes a friendly message into the error signal.
**Flow:** [19 — Ask Mode (Streaming Answer)](../flows/19-ask-streaming/19-ask-streaming.md)
**Traces:** L1-005, L2-021.
**Severity:** Medium — when `/api/ask` returns a 4xx/5xx the SPA renders `ask_failed_429`, `ask_failed_500`, etc. literally in the chat error band. Flow 19 alternatives explicitly call for friendly handling of 429 (rate limit) — and ideally an actionable message for 400 (empty/too-long question) and generic failures.

## Observed

`frontend/src/app/chat/ask.service.ts`:

```ts
if (!res.ok || !res.body) {
  this.error.set(`ask_failed_${res.status}`);
  this.finishStreaming(assistantMsg.id);
  return;
}
```

`ask.page.ts` then renders the raw signal:

```html
@if (error()) {
  <div class="error" role="alert">{{ error() }}</div>
}
```

## Expected

Per Flow 19 alternatives + the friendly-error pattern used elsewhere in the app:

- `429` → "Too many questions — try again in a minute."
- `400` → "Question is empty or too long."
- Anything else → "Could not reach the assistant. Please try again."

## Fix sketch

Branch in `AskService.send` before the early return:

```ts
if (!res.ok || !res.body) {
  if (res.status === 429) this.error.set('Too many questions — try again in a minute.');
  else if (res.status === 400) this.error.set('Question is empty or too long.');
  else this.error.set('Could not reach the assistant. Please try again.');
  this.finishStreaming(assistantMsg.id);
  return;
}
```
