# 401 on a protected endpoint does not redirect to `/login`

**Flow:** [04 — Authenticated Request](../flows/04-authenticated-request/04-authenticated-request.md)
**Traces:** L1-013, L2-003, L2-056.
**Severity:** High — a user whose session lapses mid-use sees raw `xxx_failed_401` error strings instead of being asked to sign in.

## Observed

Every feature service (`ContactsService`, `StacksService`, `SuggestionsService`, `SearchService`, `AskService`, `IntrosService`, `ImportsService`, `InteractionsService`) makes a bare `fetch` call with `credentials: 'include'` and throws `new Error(<feature>_failed_<status>)` for any non-success status — including `401`. For example `frontend/src/app/contacts/contacts.service.ts`:

```ts
async list(...) {
  const res = await fetch(`/api/contacts?${params}`, { credentials: 'include' });
  if (res.status !== 200) throw new Error('list_failed_' + res.status);
  ...
}
```

`auth.service.ts` is the only file that branches on `401`, and it does so only for the login request. A `grep` for `status === 401` outside `auth.service.ts` returns no matches.

## Expected

Per Flow 02 alternative "Token or cookie lost → 401 on next protected call forces redirect to login" — if any protected call (`/api/*` except `/api/auth/*` and `/api/ping`) returns `401`, the SPA should:

1. Clear the in-memory auth signal.
2. Navigate to `/login`.

This is the app-wide pipeline contract; per-service code should not have to implement it.

## Fix sketch

Install a `window.fetch` interceptor during app bootstrap that observes response statuses and, for a non-auth `401`, clears the session and routes to `/login`. Register it in `app.config.ts` via `provideAppInitializer` alongside the existing `auth.bootstrap()` call so every service benefits without touching feature code.
