using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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

    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db, Argon2Hasher hasher) =>
        {
            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var password = req.Password ?? "";
            if (string.IsNullOrWhiteSpace(email) || !EmailRegex.IsMatch(email))
                return Results.BadRequest(new { error = "invalid_email" });
            if (password.Length < 12 || !password.Any(char.IsLetter) || !password.Any(char.IsDigit))
                return Results.BadRequest(new { error = "weak_password" });

            var exists = await db.Users.AnyAsync(u => u.Email == email);
            if (exists) return Results.Conflict(new { error = "email_taken" });

            var user = new User { Email = email, PasswordHash = hasher.Hash(password) };
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
