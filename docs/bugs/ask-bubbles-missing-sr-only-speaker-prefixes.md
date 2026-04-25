# Ask bubbles do not announce the speaker to screen readers

**Flow:** [41 — Screen Reader Announcement for Streaming Chat](../flows/41-screen-reader-streaming/41-screen-reader-streaming.md)
**Traces:** L1-015, L2-068.
**Severity:** Low — Flow 41 step 2 says the user bubble enters the live region as `You said: {question}`. The current template renders only `{{ m.text }}`, so a screen reader hears the new bubble but has no cue about who is speaking. The same applies to the assistant bubble (Flow 41 step 4 implicitly assumes the listener can tell the answer from the question).

## Observed

`frontend/src/app/pages/ask/ask.page.ts`:

```html
@if (m.role === 'user') {
  <div data-testid="user-bubble" class="bubble user-bubble">{{ m.text }}</div>
} @else {
  <div data-testid="assistant-bubble" …>
    {{ m.text }}…
  </div>
}
```

The chat container has `role="log"` and `aria-live="polite"` so additions are announced — but the announcement carries the message text alone, no speaker label.

## Expected

Each bubble should expose a visually-hidden speaker prefix so the live-region announcement tells the user who said what. The simplest version:

- User bubble: `<span class="sr-only">You said: </span>{{ m.text }}`
- Assistant bubble: `<span class="sr-only">RecallQ said: </span>{{ m.text }}…`

The `.sr-only` class already exists in `home.page.ts` and the search input; either move it to a global rule or duplicate the well-known pattern locally.

## Fix sketch

1. Add the two `<span class="sr-only">` prefixes inside the existing bubble divs in `ask.page.ts`.
2. Ensure `.sr-only` is defined in the page styles (matches the global pattern: `position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;`).
