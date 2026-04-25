# Reset password route is not configured in app router

**Status:** Complete
**Flow:** [43 - Reset Password](../flows/43-reset-password/43-reset-password.md)
**Severity:** Critical (authentication flow broken, all 6 reset-password E2E tests failing)

## Symptom

The reset-password page component exists at `frontend/src/app/pages/reset-password/` with HTML, TS, and CSS files, but navigating to `/reset-password?token=...` returns a 404 or blank page. E2E tests fail because the page elements (headings, inputs) are not found.

Test failures:
- "page with no token shows broken-link panel and request-new-link CTA" - element not visible
- "password mismatch disables submit and shows inline error" - timeout waiting for input
- "show and hide toggle flips password input type" - element not found
- "submit success redirects to login and shows confirmation toast" - timeout
- "400 invalid token flips to broken-link panel" - timeout
- "reset password page uses the auth chrome and primary action" - element not visible

## Expected

The reset-password route is configured in `app.routes.ts` so that:
1. `/reset-password` navigation works
2. The ResetPasswordPage component is loaded
3. Page renders with heading "Reset Password"
4. Input fields for password and password confirmation are visible
5. Token validation displays appropriate UI states

## Actual

No route configuration found for reset-password in app routing. Component files exist but are unreachable.

## Repro

1. Run: `npm run test reset-password.spec.ts` from `e2e/` directory
2. Observe all 6 tests fail with "element(s) not found" errors

## Notes

Radically simple fix:

- Add route to `frontend/src/app/app.routes.ts`:
  ```typescript
  {
    path: 'reset-password',
    component: ResetPasswordPage
  }
  ```
- Ensure ResetPasswordPage is imported
- All 6 E2E tests should pass once route is configured
