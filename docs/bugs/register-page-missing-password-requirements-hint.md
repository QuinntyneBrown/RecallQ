# Register page hides the password requirements

**Flow:** 01 — User Registration
**Severity:** Low-Medium (UX, friction)
**Status:** Complete — `register.page.html` now renders `<p class="hint" data-testid="password-hint">At least 12 characters, including a letter and a digit.</p>` directly under the password input. `register.page.css` adds a small muted-foreground style for `.hint`. Visitors see the rule before they ever submit.

## Symptom

Flow 01 step 3 specifies the server's password validation rule:

> Password length ≥ 12, at least one letter and one digit.

The SPA's `RegisterPage` already knows this rule — it surfaces it in
the `weak_password` error message:

```ts
weak_password: 'Password must be at least 12 characters and include both letters and digits.',
```

…but the rule is only shown *after* the user has typed a password,
tapped Create account, and waited for the round-trip to fail.
There is no hint near the input that lists the requirements
upfront, so first-time visitors:

1. Type their usual short password.
2. Tap Create account.
3. Wait for the network round-trip.
4. See the rule in an error.
5. Lengthen / mix in a digit.
6. Retry.

## Expected

A short helper line under the Password field that lists the
requirements before submission. The user can comply on the first
attempt, no failed round-trip required.

## Actual

No hint is rendered. Users learn the rule by failing.

## Repro

1. Open `/register` as an anonymous visitor.
2. Inspect the password field area — there is no helper text.
3. Type a 6-character password and tap Create account.
4. Wait for the request, see the error appear.

## Notes

Radically simple fix: add a `<p class="hint">At least 12 characters,
including a letter and a digit.</p>` directly below the password
`<app-input-field>` in `register.page.html`, with a small
muted-foreground style in the page CSS.
