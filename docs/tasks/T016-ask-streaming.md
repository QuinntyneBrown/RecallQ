# T016 — Ask Mode Streaming

| | |
|---|---|
| **Slice** | [11 Ask streaming](../detailed-designs/11-ask-mode-streaming/README.md) |
| **L2 traces** | L2-021, L2-022, L2-025, L2-055, L2-061, L2-071, L2-084 |
| **Prerequisites** | T013 |
| **Produces UI** | Yes |

## Objective

Ship `POST /api/ask` with SSE streaming and the chat-style `AskModePage` that appends tokens into an assistant bubble as they arrive.

## Scope

**In:**
- `IChatClient` + `OpenAIChatClient` streaming implementation.
- `FakeChatClient` for tests that yields `["Based ","on ","your ","network…"]`.
- `Endpoints/AskEndpoints.cs` with SSE.
- `AskModePage` at `/ask` with input bar (`plus`, text input, `mic`, gradient send) matching `tUHxK`.
- User bubble right-aligned gradient, assistant bubble left-aligned surface.

**Out:**
- Citations (T017).
- Follow-ups (T018).

## ATDD workflow

1. **Red — API**:
   - `Ask_streams_tokens` (L2-022) — using `FakeChatClient`, verify SSE chunks.
   - `First_token_within_1500ms_p95` (L2-061) — deterministic via fake client.
   - `Rate_limited_21st_per_minute` (L2-055).
   - `Question_not_in_logs` (L2-071).
2. **Red — e2e**:
   - `T016-ask.spec.ts` — open `/ask`, type question, send, assert user bubble appears and assistant bubble streams characters in.
3. **Green** — implement `IChatClient` + endpoint + page.

## Playwright POM

`pages/ask-mode.page.ts`:
```ts
export class AskModePage {
  constructor(private page: Page) {}
  async goto(seed?: string) { await this.page.goto(`/ask${seed ? `?q=${encodeURIComponent(seed)}` : ''}`); }
  async type(q: string) { await this.page.getByRole('textbox', { name: 'Ask anything' }).fill(q); }
  async send() { await this.page.getByRole('button', { name: 'Send' }).click(); }
  userBubbles()      { return this.page.getByTestId('user-bubble'); }
  assistantBubbles() { return this.page.getByTestId('assistant-bubble'); }
  greetBubble()      { return this.page.getByTestId('greet-bubble'); }
  inputBar()         { return this.page.getByTestId('input-bar'); }
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Server uses `Response.Body.FlushAsync` between tokens — not buffered.
- [ ] Client uses `fetch().body.getReader()` or equivalent; does not use polling.
- [ ] Input bar sticks above the mobile keyboard via `env(safe-area-inset-bottom)` or a specific viewport-aware container.

## Screenshot

`docs/tasks/screenshots/T016-ask.png` — ask mode mid-stream with user bubble and partially-filled assistant bubble.

## Definition of Done

- [ ] 4 API tests + 1 e2e pass.
- [ ] Sending a question streams into the UI.
- [ ] Three verification passes complete clean.
