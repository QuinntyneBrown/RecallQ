# Ask page traps users after session expiry — 401 isn't routed to login

**Flow:** 19 — Ask Mode (Streaming Answer); auth handling per Flow 04
**Severity:** Medium-High (a session timeout while using Ask shows a generic "Could not reach the assistant" error and leaves the user stuck on `/ask` with no path back to login; their only recovery is to manually navigate, which loses the question they were typing)
**Status:** Open

## Symptom

`frontend/src/app/chat/ask.service.ts` uses raw `fetch` so the SSE response body can be streamed:

```typescript
const res = await fetch('/api/ask', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
if (!res.ok || !res.body) {
  if (res.status === 429) {
    this.error.set('Too many questions — try again in a minute.');
  } else if (res.status === 400) {
    this.error.set('Question is empty or too long.');
  } else {
    this.error.set('Could not reach the assistant. Please try again.');
  }
  this.finishStreaming(assistantMsg.id);
  return;
}
```

There is no branch for `res.status === 401`. The fallback `else` lumps it in with 500/503/network failures and shows the generic message.

The new `apiInterceptor` in `frontend/src/app/app.config.ts` is an Angular `HttpInterceptorFn`:

```typescript
const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && isProtectedApi(req.url)) {
        auth.authState.set(null);
        const url = router.url;
        const usable = url && url !== '/' && !url.startsWith('/login');
        const target = usable ? `/login?returnUrl=${encodeURIComponent(url)}` : '/login';
        void router.navigateByUrl(target);
      }
      throw error;
    })
  );
};
```

That interceptor only sees `HttpClient` traffic. Every `HttpClient`-based service (`AuthService`, `ContactsService`, `SearchService`, `SuggestionsService`) is fine. `AskService` is the one service that bypasses it because it needs the raw `Response.body.getReader()` for SSE.

So when an authenticated session quietly expires (cookie eviction, server restart, dev environment refresh) and the user submits a question, the API returns 401 with the JSON body `{"error":"invalid_credentials"}`-shape from cookie auth's challenge. `AskService` sees `!res.ok`, hits the catchall, sets `error = 'Could not reach the assistant. Please try again.'`, and stops. The auth state stays "logged in" in the SPA. The user is stranded on `/ask` until they figure out to manually navigate elsewhere.

`ContactsService` users in the same situation get auto-redirected to `/login?returnUrl=/contacts/...` thanks to the interceptor. Ask users do not. The flow's own description (step 3 onward) presupposes an authenticated path; there's no provision in flow 19 for what to do on auth failure mid-session.

## Expected

When `/api/ask` returns 401:

1. `AuthService.authState` is cleared (no leftover "I'm logged in" state).
2. The router navigates to `/login?returnUrl=/ask` (or whatever the current URL is) so post-login the user lands back where they were.
3. The Ask page's transient error message is irrelevant at that point — they're already on Login.

This mirrors the `apiInterceptor`'s behavior for HttpClient calls.

## Actual

`AskService` shows the generic "Could not reach the assistant. Please try again." error. The user retries; gets the same error; eventually gives up. The login redirect never fires because no `HttpClient` request was issued.

## Repro

1. Log in.
2. Navigate to `/ask`.
3. In a separate tab or via the browser console, clear the `rq_auth` cookie:
   `document.cookie = 'rq_auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'`.
4. Submit any question.
5. Observe: `Could not reach the assistant. Please try again.` toast/error. The URL stays at `/ask`. The user is not redirected to `/login`.

Compare to `/contacts` (or any HttpClient-served page) — there, the same cookie clear + any subsequent navigation immediately redirects to `/login?returnUrl=...`.

## Notes

Radically simple fix — handle 401 explicitly in `AskService.send` and run the same redirect logic the interceptor uses. The cleanest path is to extract the redirect into a helper that both the interceptor and the Ask service call, but a self-contained inline branch in `ask.service.ts` is the smaller diff:

```typescript
if (res.status === 401) {
  this.auth.authState.set(null);
  const url = this.router.url;
  const usable = url && url !== '/' && !url.startsWith('/login');
  const target = usable ? `/login?returnUrl=${encodeURIComponent(url)}` : '/login';
  void this.router.navigateByUrl(target);
  this.finishStreaming(assistantMsg.id);
  return;
}
```

Inject `Router` alongside the existing `AuthService`. The HttpClient interceptor stays as-is for everything else. A regression test mocks `/api/ask` to return 401 and asserts the SPA ends up at `/login?returnUrl=/ask`.
