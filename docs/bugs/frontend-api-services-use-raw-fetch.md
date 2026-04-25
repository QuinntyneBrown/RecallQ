# Frontend API services use raw `fetch` instead of Angular `HttpClient`

**Status:** Complete
**Source:** `docs/code-quality-audit.md` - High finding, "Frontend API access violates the stated simple architecture"
**Spec:** L1 radical simplicity constraint; L2-075 "HttpClient for API calls, no bespoke abstractions"
**Severity:** High (cross-cutting architecture drift and hidden request behavior)

## Symptom

The frontend still makes normal JSON API calls through raw `fetch`.
Examples:

```ts
// frontend/src/app/contacts/contacts.service.ts
const res = await fetch('/api/contacts', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

`frontend/src/app/app.config.ts` does not register `provideHttpClient`.
Instead, it installs a global `window.fetch` interceptor for 401
handling:

```ts
installApiInterceptor(() => {
  auth.authState.set(null);
  ...
});
```

Raw `fetch` remains in `ContactsService`, `SearchService`,
`AuthService`, `InteractionsService`, `ImportsService`, `IntrosService`,
`SuggestionsService`, `StacksService`, and `HealthService`.

## Expected

Per L2-075, normal frontend API calls use Angular's built-in
`HttpClient` methods. App-wide behavior such as credential handling and
401 redirects should live in Angular's HTTP pipeline, not in a global
monkey patch.

The `/api/ask` streaming path may keep raw `fetch` if needed because it
reads a streamed response body.

## Actual

The app uses raw `fetch` for nearly all API traffic and relies on a
global `window.fetch` replacement to observe protected-endpoint 401s.

## Repro

1. Run `rg -n "fetch\\(" frontend/src/app`.
2. Run `rg -n "provideHttpClient|HttpClient|withInterceptors" frontend/src/app`.
3. Observe many raw `fetch` calls and no Angular `HttpClient`
   registration.

## Notes

Radically simple fix:

- Register `provideHttpClient(withInterceptors(...))` in
  `app.config.ts`.
- Convert normal JSON services to inject `HttpClient`.
- Move 401 redirect behavior into an Angular HTTP interceptor.
- Keep the streaming `/api/ask` exception local to `AskService`.
