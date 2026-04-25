# Backend build is broken by half-implemented forgot/reset-password feature

**Flow:** 43 — Reset Password (in progress; not yet a working flow)
**Severity:** Critical (the entire backend won't compile, so the API can't start, the e2e suite can't reach a server, and the acceptance test project — which references the API — can't build either)
**Status:** Complete — `AppDbContext.cs` no longer declares `DbSet<PasswordResetToken>`, the dead `forgot-password` / `reset-password` endpoints are removed from `AuthEndpoints.cs` along with the now-unused `using Microsoft.Extensions.Options;`, and `SchemaMigrationTests.cs` is unstuck (unused `Microsoft.Data.SqlClient` import dropped, plus xunit `Assert.DoesNotContain` calls reduced to the supported two-arg overload). Verified by new `BuildHealthTests.cs` which boots the WebApplicationFactory and hits `/api/ping` — it now passes.

## Symptom

```
$ dotnet build backend/RecallQ.Api
…
backend/RecallQ.Api/AppDbContext.cs(26,18): error CS0246: The type or namespace name 'PasswordResetToken' could not be found …

Build FAILED.
1 Error(s)
```

Three commits incrementally added forgot/reset-password code without the supporting types:

- `51f55ec` (`fix(config): require explicit OpenAI key … — Add PasswordResetTokens DbSet to AppDbContext`) added `public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();` and `User.PasswordChangedAt`. **No `PasswordResetToken` entity class was created.** This is what trips CS0246.
- An earlier commit added `MapPost("/api/auth/forgot-password", …)` and `MapPost("/api/auth/reset-password", …)` to `AuthEndpoints.cs`. They inject `PasswordResetTokenService` and `IPasswordResetEmailSender` and reference `AuthOptions.ResetTokenTtl`.
  - `PasswordResetTokenService` — referenced but **no class declaration exists anywhere** (`grep -r "class PasswordResetTokenService" backend/` → nothing).
  - `IPasswordResetEmailSender` — referenced but **no interface declaration exists anywhere**.
  - Neither is registered in `Program.cs`.
- `AuthOptions` exists at `backend/RecallQ.Api/Security/AuthOptions.cs` and has `ResetTokenTtl`, so that one is fine.

The C# compiler stops at the first error, so it fails on the missing entity in `AppDbContext.cs:26`. Repairing only that error would just expose the next layer (`PasswordResetTokenService`, `IPasswordResetEmailSender`) and continue cascading.

## Expected

`dotnet build backend/RecallQ.Api` succeeds. The acceptance tests (which reference `RecallQ.Api`) compile. The e2e Playwright suite (which boots the API as a webServer) can start the backend.

## Actual

Build fails at the first dangling reference. Every downstream consumer (acceptance tests, e2e Playwright tests, manual `dotnet run`) is blocked.

## Repro

```
git checkout main
cd backend/RecallQ.Api
dotnet build
```

Observe `error CS0246: The type or namespace name 'PasswordResetToken' could not be found`. From the e2e directory:

```
cd ../../e2e
npx playwright test --reporter=list
```

Observe `Process from config.webServer was not able to start. Exit code: 1` because the dotnet build step inside the webServer fails for the same reason.

## Notes

The forgot/reset-password feature has no callers, no tests, no frontend route, no entity, no service, and no email sender — it's dead code in `AuthEndpoints.cs` plus an unsupported `DbSet` in `AppDbContext.cs`.

Radically simple fix — restore the build by removing the dead references. The full reset-password feature can land when its supporting infrastructure (entity, service, sender, DI registrations, tests, a frontend route) is actually in place.

Concrete:

1. `backend/RecallQ.Api/AppDbContext.cs`: drop the `public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();` line.
2. `backend/RecallQ.Api/Endpoints/AuthEndpoints.cs`: drop the `MapPost("/api/auth/forgot-password", …)` and `MapPost("/api/auth/reset-password", …)` handlers, and the `ForgotPasswordRequest` / `ResetPasswordRequest` records that go with them. Drop the `using Microsoft.Extensions.Options;` if it becomes unused.
3. Leave `User.PasswordChangedAt`, `AuthOptions.ResetTokenTtl`, and the `IsStrongPassword` helper in place — they're harmless additions that the future feature will lean on.

This is a deletion, not a destructive override of in-progress work — every removed line currently fails to compile or runs unreachable code.
