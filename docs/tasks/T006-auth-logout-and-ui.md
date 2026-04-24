# T006 — Logout + Register/Login Pages

| | |
|---|---|
| **Slice** | [02 User authentication](../detailed-designs/02-user-authentication/README.md) |
| **L2 traces** | L2-003, L2-004 |
| **Prerequisites** | T005 |
| **Produces UI** | Yes |

## Objective

Add `POST /api/auth/logout` with server-side session revocation and ship the Register, Login pages and a "route guard" that redirects unauthenticated users to `/login`.

## Scope

**In:**
- `POST /api/auth/logout` (204) — adds the session id to `SessionRevocationStore` and clears the cookie.
- Middleware that rejects requests whose session id is in the revocation store.
- Angular routes `/register`, `/login`, `/logout`.
- `RegisterPage`, `LoginPage` — plain forms using `ButtonPrimary` + `InputField` components (create `InputField` here since this is the first form).
- `authGuard` `CanMatch` function redirecting to `/login` when `authState.isAuthenticated()` is false.
- `authState = signal<{id: string} | null>(null)` populated by calling `/api/auth/me` at bootstrap.

**Out:**
- Any page other than register/login (later tasks).

## ATDD workflow

1. **Red — API** — `Logout_invalidates_cookie` and `Protected_endpoint_with_revoked_cookie_returns_401` (L2-004, L2-003).
2. **Red — e2e** — `T006-auth.spec.ts`:
   - Navigates to `/login` while unauthenticated (from any protected route) ⇒ assert redirected.
   - Completes registration via `AuthPage`.
   - Logs in, reaches home.
   - Taps Logout in profile menu, asserts redirect to `/login`.
3. **Green** — implement logout + revocation + routes + `authGuard`.

## Playwright POM

`pages/auth.page.ts`:
```ts
export class AuthPage {
  constructor(private page: Page) {}
  async gotoRegister() { await this.page.goto('/register'); }
  async gotoLogin() { await this.page.goto('/login'); }
  async register(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }
  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
  async logout() {
    await this.page.getByRole('button', { name: 'Profile' }).click();
    await this.page.getByRole('menuitem', { name: 'Log out' }).click();
  }
}
```

Add a reusable `flows/register.flow.ts` that composes register + login and is used by many later tests.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Both form fields use `<label for="..">` — never placeholder-only labels.
- [ ] The Register page form layout matches mobile 390px width, single column, gap 16px.
- [ ] Auth state is a `signal`, not a BehaviorSubject or service with `.next()`.

## Screenshot

`docs/tasks/screenshots/T006-login.png` — login page at 375×667 with fields labeled and primary button visible.

## Definition of Done

- [ ] 2 API tests + 1 e2e spec pass.
- [ ] Navigating to `/home` while anonymous redirects to `/login`.
- [ ] After logout, the cookie is cleared and `/api/auth/me` returns 401.
- [ ] Three verification passes complete clean.
