using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class AuthEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly byte[] InvalidCredentialsBody =
        System.Text.Encoding.UTF8.GetBytes("{\"error\":\"invalid_credentials\"}");

    public record RegisterRequest(string? Email, string? Password);
    public record LoginRequest(string? Email, string? Password, bool? RememberMe);
    public record ForgotPasswordRequest(string? Email);
    public record ResetPasswordRequest(string? Token, string? NewPassword);

    private static readonly (string Name, Entities.StackKind Kind, string Definition, int Order)[] DefaultStacks = new[]
    {
        ("AI founders",   Entities.StackKind.Query,          "AI founders",   0),
        ("Intros owed",   Entities.StackKind.Classification, "intros_owed",   1),
        ("Close friends", Entities.StackKind.Query,          "Close friends", 2),
    };

    private static async Task SeedDefaultStacksAsync(AppDbContext db, Guid userId)
    {
        foreach (var d in DefaultStacks)
        {
            db.Stacks.Add(new Entities.Stack
            {
                OwnerUserId = userId,
                Name = d.Name,
                Kind = d.Kind,
                Definition = d.Definition,
                SortOrder = d.Order,
            });
        }
        await db.SaveChangesAsync();
    }

    private static bool IsStrongPassword(string password) =>
        password.Length >= 12 && password.Any(char.IsLetter) && password.Any(char.IsDigit);

    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db, Argon2Hasher hasher) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var password = req.Password ?? "";
            if (string.IsNullOrWhiteSpace(email) || !EmailRegex.IsMatch(email))
                return Results.BadRequest(new { error = "invalid_email" });
            if (!IsStrongPassword(password))
                return Results.BadRequest(new { error = "weak_password" });

            var exists = await db.Users.AnyAsync(u => u.Email == email);
            if (exists) return Results.Conflict(new { error = "email_taken" });

            var now = DateTime.UtcNow;
            var user = new User { Email = email, PasswordHash = hasher.Hash(password), CreatedAt = now, PasswordChangedAt = now.AddSeconds(-1) };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            await SeedDefaultStacksAsync(db, user.Id);
            return Results.Created($"/api/auth/users/{user.Id}", new { id = user.Id, email = user.Email });
        }).RequireRateLimiting("register");

        app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, Argon2Hasher hasher, HttpContext http) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var password = req.Password ?? "";
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null || !hasher.Verify(password, user.PasswordHash))
            {
                http.Response.StatusCode = 401;
                http.Response.ContentType = "application/json";
                await http.Response.Body.WriteAsync(InvalidCredentialsBody);
                return;
            }
            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("sid", Guid.NewGuid().ToString())
            }, CookieAuthenticationDefaults.AuthenticationScheme);
            var rememberMe = req.RememberMe == true;
            var props = new AuthenticationProperties
            {
                IsPersistent = rememberMe,
                ExpiresUtc = DateTimeOffset.UtcNow.Add(rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(24)),
                AllowRefresh = false
            };
            await http.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                props);
            http.Response.StatusCode = 200;
            await http.Response.WriteAsJsonAsync(new { id = user.Id, email = user.Email });
        }).RequireRateLimiting(LoginRateLimit.PolicyName);

        app.MapPost("/api/auth/forgot-password", async (
            ForgotPasswordRequest req,
            AppDbContext db,
            PasswordResetTokenService tokens,
            IPasswordResetEmailSender mail,
            IOptions<AuthOptions> opts,
            CancellationToken ct) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email) || !EmailRegex.IsMatch(email))
                return Results.BadRequest(new { error = "invalid_email" });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
            if (user is not null)
            {
                var issued = tokens.Issue(user.Id);
                await tokens.PersistAsync(user.Id, tokens.Hash(issued.RawToken), issued.ExpiresAt, ct);
                await mail.SendAsync(email, issued.RawToken, opts.Value.ResetTokenTtl, ct);
            }

            return Results.Accepted();
        }).RequireRateLimiting("forgot-password");

        app.MapPost("/api/auth/reset-password", async (
            ResetPasswordRequest req,
            AppDbContext db,
            PasswordResetTokenService tokens,
            Argon2Hasher hasher,
            TimeProvider clock,
            CancellationToken ct) =>
        {
            var raw = req.Token ?? "";
            var password = req.NewPassword ?? "";
            if (string.IsNullOrWhiteSpace(raw))
                return Results.BadRequest(new { error = "invalid_token" });
            if (!IsStrongPassword(password))
                return Results.BadRequest(new { error = "weak_password" });

            var hash = tokens.Hash(raw);
            var now = clock.GetUtcNow().UtcDateTime;
            var token = await db.PasswordResetTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
            if (token is null || token.UsedAt is not null || token.ExpiresAt < now)
                return Results.BadRequest(new { error = "invalid_token" });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == token.OwnerUserId, ct);
            if (user is null)
                return Results.BadRequest(new { error = "invalid_token" });

            user.PasswordHash = hasher.Hash(password);
            user.PasswordChangedAt = now;
            token.UsedAt = now;
            await db.PasswordResetTokens
                .Where(t => t.OwnerUserId == user.Id && t.UsedAt == null && t.Id != token.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, now), ct);

            await db.SaveChangesAsync(ct);
            return Results.Ok();
        }).RequireRateLimiting("reset-password");

        app.MapGet("/api/auth/me", [Authorize] (ICurrentUser current) =>
            Results.Ok(new { id = current.UserId, email = current.Email }));

        app.MapPost("/api/auth/logout", [Authorize] async (HttpContext http, SessionRevocationStore store) =>
        {
            var sid = http.User.FindFirst("sid")?.Value;
            if (Guid.TryParse(sid, out var sessionId)) store.Revoke(sessionId);
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        return app;
    }
}
