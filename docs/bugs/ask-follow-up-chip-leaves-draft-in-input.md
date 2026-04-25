# Tapping a follow-up chip leaves the unsent draft in the input

**Flow:** 21 — Ask Follow-Up Chips
**Severity:** Medium-High (UX confusion)
**Status:** Open

## Symptom

Flow 21 step 6:

> When the user taps a chip the SPA calls `submit(chipText)` which
> becomes the next user bubble and fires flow 19 again for the new
> turn.

`AskPage.submit(input)` clears the input value and resets the `draft`
signal:

```ts
input.value = '';
this.draft.set('');
await this.ask.send(q, this.currentContactId());
```

But the SPA's actual chip handler bypasses `submit` and calls
`ask.send` directly:

```ts
async handleFollowUp(text: string): Promise<void> {
  await this.ask.send(text, this.currentContactId());
}
```

So when the user has typed something in the input bar, then taps a
follow-up chip, the chip's question is submitted but the draft text
is left dangling in the input. The next press of Enter would then
send the stale draft, even though the user thought the chat had moved
on. This mirrors the recently fixed new-session draft issue.

## Expected

Chip taps clear the input/draft so the input bar is empty after the
new user bubble appears, matching the flow's "calls submit(chipText)"
phrasing.

## Actual

Chip taps fire `ask.send` directly; the input retains whatever the
user had typed.

## Repro

1. Visit `/ask`.
2. Send a question and wait for the assistant response (with a
   follow-up chip).
3. Type "stale draft" into the input bar — do not press Enter.
4. Tap any follow-up chip.
5. Observe: the chip's question becomes the next user bubble, and the
   input bar still contains "stale draft".

## Notes

Radically simple fix: in `AskPage.handleFollowUp`, call
`this.draft.set('')` before `ask.send(...)`.
