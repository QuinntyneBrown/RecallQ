# T004 — Ping Endpoint + Health Check

| | |
|---|---|
| **Slice** | [01 Architecture skeleton](../detailed-designs/01-architecture-skeleton/README.md) |
| **L2 traces** | L2-057 (HTTPS/HSTS groundwork), L2-072 |
| **Prerequisites** | T001, T002, T003 |
| **Produces UI** | Yes (status indicator on the bottom nav) |

## Objective

Ship `GET /api/ping` returning `pong`, `GET /health` returning 200 when the database is reachable, and an Angular `HealthService` that calls `/api/ping` on startup and flips a green indicator on the bottom nav when healthy.

## Scope

**In:**
- `Endpoints/PingEndpoints.cs` with `MapPing(app)` registering `/api/ping`.
- `app.MapHealthChecks("/health")` in `Program.cs` with a `SELECT 1` db check.
- HSTS + HTTPS redirection enabled in Production only.
- `HealthService` as an Angular `@Injectable({providedIn:'root'})` exposing `online = signal(false)`.
- A tiny dot in the bottom nav that fills `var(--success)` when `online() === true`.

**Out:**
- Auth (T005/T006).
- Any other endpoint.

## ATDD workflow

1. **Red — API** — `PingTests` asserts `GET /api/ping` returns `200 "pong"` (xUnit + `WebApplicationFactory`).
2. **Red — API** — `HealthTests` asserts `GET /health` is 200 when Postgres is up (Testcontainers).
3. **Red — e2e** — `T004-ping.spec.ts` loads the app, waits for the dot to be filled, screenshots.
4. **Red** — all three red.
5. **Green** — implement minimal API endpoint, wire `AppDbContext` health check, wire `HealthService`.

## Playwright POM

Extend `pages/app-shell.page.ts`:
```ts
async healthDot() {
  return this.page.getByTestId('health-dot');
}
async isOnline() {
  return (await this.healthDot()).evaluate(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)');
}
```

Spec:
```ts
// Traces to: L2-072
// Task: T004
test('app reports online when API is healthy', async ({ page }) => {
  const shell = new AppShellPage(page);
  await shell.goto();
  await expect.poll(() => shell.isOnline()).toBe(true);
  await screenshot(page, 'T004-online');
});
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `Program.cs` still under 120 lines.
- [ ] `PingEndpoints.cs` is the only file adding endpoints; no ping handler is inlined in `Program.cs`.
- [ ] The health dot color comes from `var(--success)`, not a literal.

## Screenshot

`docs/tasks/screenshots/T004-online.png` — mobile shell with the green health dot visible on the bottom nav.

## Definition of Done

- [x] Three unit/integration tests and one e2e test pass.
- [x] Hitting the API with `curl http://localhost:5151/api/ping` returns `pong`. *(port 5151 per launchSettings)*
- [x] Stopping the DB causes `/health` to return 503 and the dot to clear.
- [x] Three verification passes complete clean.

**Status: Complete**
