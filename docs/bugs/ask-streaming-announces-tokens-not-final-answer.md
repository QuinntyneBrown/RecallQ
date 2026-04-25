# Ask streaming announces every token instead of the final answer once

**Flow:** 41 — Screen Reader Announcement for Streaming Chat
**Severity:** Medium-High (every screen-reader user who asks a question gets a fragment-by-fragment readout — usually a stuttering, half-word stream — instead of a single clean announcement of the assistant's reply)
**Status:** Open

## Symptom

`frontend/src/app/pages/ask/ask.page.html`:

```html
<div class="chat-list" #list role="log" aria-live="polite" aria-relevant="additions text">
  …
  } @else {
    <div data-testid="assistant-bubble" class="bubble assistant-bubble" [attr.aria-busy]="m.streaming ? 'true' : null">
      <span class="sr-only">RecallQ said: </span>{{ m.text }}@if (m.streaming) {<span class="cursor">▎</span>}
      …
    </div>
  }
  …
</div>
```

The chat-list is a `role="log"` live region with `aria-live="polite"` *and* `aria-relevant="additions text"`. The assistant bubble lives inside that region, and `{{ m.text }}` is updated on every SSE `event: token` frame in `ask.service.ts`:

```typescript
private appendText(id: string, chunk: string): void {
  this.messages.update(list =>
    list.map(m => (m.id === id ? { ...m, text: m.text + chunk } : m)),
  );
}
```

`aria-relevant="additions text"` tells assistive tech to announce **both** new child elements **and** changes to text content inside the region. So every token concatenation triggers an SR announcement of the bubble's accumulated text. NVDA, JAWS, and VoiceOver re-read the in-progress answer over and over as the LLM streams (or, worse, get into a queue-spam state where they're always behind, never finishing).

Flow 41 explicitly forbids this:

> 3. The assistant answer bubble is also inside the live region, but **streaming tokens are written to a hidden buffer**, not to the announcement node. The visible UI still renders tokens progressively (sighted users see them live).
> 4. When the server emits `event: done`, the buffered full answer text is **atomically written into the live region**. The screen reader announces the entire answer once.

The intent: sighted users see tokens stream as they arrive (low-latency feedback), screen-reader users hear one clean announcement after the answer is finished.

## Expected

Pick one of the two approaches. The **simpler** one matches the flow's intent without restructuring the DOM:

- The visible assistant bubble keeps streaming tokens into `{{ m.text }}` as today (sighted-user UX unchanged).
- The bubble itself is **outside** the live region, OR the live region's `aria-relevant` drops the `text` token so per-token text mutations don't trigger announcements.
- A separate, sr-only live-region node is appended a single time per assistant message, only after `event: done`, with the full answer text. That's the one node screen readers announce.

The architecturally cleaner version uses a hidden `aria-live` element on the page and writes the *final* text into it once when `streaming` flips to `false`. Then the visible bubble doesn't need to be in a live region at all.

## Actual

Tokens stream into a live-region descendant. Each text mutation announces the whole accumulated answer. Screen-reader users hear "Sure—" then "Sure— I think" then "Sure— I think you should" then "Sure— I think you should reach out to" — overlapping, repetitive, exhausting. Flow 41 step 4's "announces the entire answer once" never happens.

## Repro

1. Visit `/ask` with NVDA or VoiceOver running.
2. Send a question that yields a multi-sentence response.
3. Listen: the screen reader re-reads the partial answer as each token arrives. The "single, atomic announcement on done" that flow 41 specifies never happens.

A more deterministic test: stub the SSE response with two `event: token` frames + an `event: done`. Inspect the DOM mid-stream — `aria-relevant="additions text"` and the live tokens are visible inside `role="log"`. That combination is what trips assistive tech.

## Notes

Radically simple fix in `ask.page.html`:

1. Remove `aria-relevant="additions text"` (or drop just the `text` token). The default `aria-relevant` value is `additions text` for `role="log"`, so the explicit attribute is what's making the announcement aggressive — making it `aria-relevant="additions"` is enough to stop per-token text mutations from being announced.
2. Append a one-shot announcement element when `streaming` flips to `false`. The simplest: in the assistant bubble, gate the speaker-prefixed sr-only span on `!m.streaming`, so the entire announcement only enters the live region after the final token lands. Sighted users still see the bubble update token-by-token because the `{{ m.text }}` interpolation is unconditional; the `<span class="sr-only">` just no longer participates in the announcement until the answer is done.

```html
<div data-testid="assistant-bubble" class="bubble assistant-bubble" [attr.aria-busy]="m.streaming ? 'true' : null">
  @if (!m.streaming) {
    <span class="sr-only">RecallQ said: {{ m.text }}</span>
  }
  <span aria-hidden="true">{{ m.text }}</span>@if (m.streaming) { <span class="cursor" aria-hidden="true">▎</span> }
  …
</div>
```

The visible text is `aria-hidden="true"`, so SRs ignore the streaming child. The sr-only sibling appears once, post-stream, with the full answer — the live region announces it once. That matches flow 41 steps 3–4.

The existing `bug-ask-sr-only-speaker.spec.ts` test passes either way (it asserts the sr-only prefix exists on the assistant bubble after the final token). A new test asserts the sr-only span is absent while `m.streaming` is true and present once after `done`.
