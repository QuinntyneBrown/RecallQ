# Ask streaming silently swallows mid-stream `event: error`

**Flow:** 19 — Ask Mode (Streaming Answer)
**Severity:** High (lost UX recovery path)
**Status:** Open

## Symptom

Flow 19 alternatives:

> **LLM provider error mid-stream** → `event: error`, the SPA keeps
> partial answer and shows a retry chip.

The SSE loop in `ask.service.ts` recognizes `done`, `followups`, and
`citations` events; everything else falls through to the
token-parsing branch:

```ts
if (eventName === 'done') { done = true; break; }
if (eventName === 'followups') { … continue; }
if (eventName === 'citations') { … continue; }
if (!data || data === '{}') continue;
try {
  const parsed = JSON.parse(data) as { token?: string };
  if (parsed.token) this.appendText(assistantMsg.id, parsed.token);
} catch { /* ignore malformed */ }
```

When the server emits `event: error\ndata: "..."` mid-stream, the
parser tries to read it as `{ token?: string }`, finds no token, and
silently moves on. The user is left staring at a half-finished
answer with no indication that streaming aborted and no retry
affordance.

## Expected

- The assistant message keeps whatever was already streamed (no
  wiping).
- The bubble surfaces a "Couldn't finish — Retry" chip.
- Tapping retry re-asks the same question (i.e., dispatches another
  `ask.send` for the previous user message).

## Actual

- Partial answer remains.
- No error UI, no retry affordance.
- The user has no way to recover other than typing the question
  again from scratch.

## Repro

1. Mock `POST /api/ask` to return an SSE body of:
   `event: token\ndata: {"token":"Sure—"}\n\nevent: error\ndata: "llm_failed"\n\n`
2. Open `/ask`, send any question.
3. Observe: the assistant bubble shows "Sure—" and then nothing
   else; no retry chip.

## Notes

Radically simple fix:

- Add an `errored?: boolean` flag to `AskMessage`.
- In the SSE loop, handle `eventName === 'error'`: mark the in-flight
  assistant message `errored: true` and break out of the loop.
- In `ask.page.html`, when `m.role === 'assistant' && m.errored`,
  render a `Couldn't finish — Retry` button (`data-testid="ask-retry"`)
  inside the bubble.
- Add `retry(messageId)` on `AskPage` that finds the immediate
  preceding user bubble and calls `ask.send` again with that text.
