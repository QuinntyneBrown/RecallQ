# Logout leaves prior user's chat history in memory

**Flow:** 03 — User Logout
**Severity:** High (cross-user data leak in shared browser sessions)
**Status:** Complete — `AskService` now injects `AuthService` and runs an `effect()` in its constructor that calls `reset()` whenever `authState` is `null`. The dependency direction stays one-way (Auth ignorant of Ask), and the reset path is the same one already used by the `+` new-session button.

## Symptom

Flow 03 step 5:

> The SPA **clears its in-memory session signal** and navigates to
> `/login`.

`AuthService.logout` only nulls `authState`; it does not touch any
other root-scoped service state:

```ts
async logout(): Promise<void> {
  try { await fetch('/api/auth/logout', …); } catch { /* ignore */ }
  this.authState.set(null);
}
```

`AskService.messages` is a `signal<AskMessage[]>` provided in the
root injector. After user A logs out and user B registers/signs in
on the **same browser session**, navigating to `/ask` instantly
shows user A's chat bubbles until B sends their first question.

The same risk applies to other root services (`StacksService.stacks`,
`SuggestionsService.suggestion`, etc.), but the chat is the worst
offender because the content is conversational and highly personal.

## Expected

After logout, user-scoped client-side state is cleared. When user B
opens `/ask` they see only the greeting bubble, not user A's
history.

## Actual

`AskService.messages` retains user A's bubbles indefinitely until
user B happens to start a new session via the `+` button or a full
page reload.

## Repro

1. Register user A; navigate to `/ask`; send a question (mock the
   stream if needed).
2. Verify the user / assistant bubbles render.
3. Visit `/logout`.
4. Register user B (or just go to `/login`).
5. Navigate to `/ask`.
6. User A's bubbles are still visible.

## Notes

Radically simple fix:

- In `AskService`, set up an `effect()` in the constructor that
  watches `AuthService.authState`; when it transitions to `null`,
  call the existing `reset()` method (which already clears
  `messages`, `error`, and `pending`).
- This keeps `AuthService` ignorant of AskService (clean
  dependency direction) and reuses the existing reset path.
