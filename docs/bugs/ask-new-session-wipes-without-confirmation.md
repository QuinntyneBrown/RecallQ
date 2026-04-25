# Ask "New session" wipes conversation without confirmation

**Flow:** [22 — Ask New Session](../flows/22-ask-new-session/22-ask-new-session.md)
**Traces:** L1-005, L2-025.
**Severity:** Medium — a single accidental tap of `+` in the Ask top bar irrecoverably clears the visitor's entire conversation. Flow 22 step 2 explicitly calls for a small confirmation when `messages.length > 0` to avoid exactly this.

## Observed

`frontend/src/app/pages/ask/ask.page.ts`:

```ts
newSession(): void { this.ask.reset(); }
```

`AskService.reset()` then empties the messages signal and clears `pending` / `error`. There is no confirmation gate — the first tap wipes every exchange the visitor has had in this session.

## Expected

Per Flow 22 step 2: "The SPA prompts a small confirmation if `messages.length > 0` (avoiding accidental resets)."

- If there are no messages yet, tapping `+` should no-op silently.
- If there is at least one message, tapping `+` should show a confirmation (e.g. `Clear this conversation?`). Accepting resets; dismissing leaves the messages intact.

## Fix sketch

Guard the call to `this.ask.reset()` in `ask.page.ts`:

```ts
newSession(): void {
  if (this.ask.messages().length > 0 && !window.confirm('Clear this conversation?')) return;
  this.ask.reset();
}
```
