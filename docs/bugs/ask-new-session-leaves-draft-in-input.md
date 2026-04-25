# Ask new session leaves the unsent draft in the input

**Flow:** 22 — Ask New Session
**Severity:** Medium-High (UX confusion)
**Status:** Complete — `AskPage.newSession()` now also calls `this.draft.set('')` after `ask.reset()`, so the input bar empties along with the message list.

## Symptom

`AskPage.newSession()` calls `AskService.reset()`, which clears the
messages signal, error, and pending. But it does **not** clear
`AskPage.draft`, which is the signal bound to the chat input
(`[value]="draft()"`). As a result:

1. User types a question they don't want to send (e.g., "Tell me about
   Avery") into the input bar.
2. User changes their mind and taps the `+` (New session) button.
3. Messages clear, but the input still contains "Tell me about Avery".
4. The user can accidentally submit the leftover draft by hitting
   Enter, sending a question they intended to discard.

The flow's contract for `+`:

> 4. The SPA re-renders the greeting bubble only (no user/assistant
>    history visible).

The input bar belongs to the chat surface — leaving stale text in it is
the same kind of inconsistency as keeping an old assistant bubble on
screen. A "fresh session" should be visually fresh end-to-end.

## Expected

`newSession()` resets the input as well, so the screen looks identical
to a brand-new visit:

- Greeting bubble visible.
- Input bar empty.
- No error, no pending.

## Actual

Input retains whatever the user had typed before tapping `+`.

## Repro

1. Visit `/ask`.
2. Type any text into the chat input.
3. Tap the `+` button on the top bar.
4. Observe: input still holds the typed text.

## Notes

Radically simple fix: in `AskPage.newSession()`, after `ask.reset()`
also call `this.draft.set('')`.
