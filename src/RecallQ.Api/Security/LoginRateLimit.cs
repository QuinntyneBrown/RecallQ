using System.Security.Claims;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace RecallQ.Api.Security;

public static class LoginRateLimit
{
    public const string PolicyName = "login";
    private const string EmailItemKey = "login-email";

    public static IServiceCollection AddLoginRateLimit(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;
            options.AddPolicy(PolicyName, httpCtx =>
            {
                var ip = httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var email = httpCtx.Items.TryGetValue(EmailItemKey, out var e) ? e as string ?? "" : "";
                var key = $"{ip}:{email}";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromSeconds(60),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });
            options.AddPolicy("search", httpCtx =>
            {
                var key = httpCtx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });
        });
        return services;
    }

    public static IApplicationBuilder UseLoginEmailExtractor(this IApplicationBuilder app)
    {
        app.Use(async (ctx, next) =>
        {
            if (HttpMethods.IsPost(ctx.Request.Method) &&
                ctx.Request.Path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Request.EnableBuffering();
                try
                {
                    using var doc = await JsonDocument.ParseAsync(ctx.Request.Body, default, ctx.RequestAborted);
                    if (doc.RootElement.TryGetProperty("email", out var emailEl) && emailEl.ValueKind == JsonValueKind.String)
                    {
                        ctx.Items[EmailItemKey] = emailEl.GetString()?.Trim().ToLowerInvariant() ?? "";
                    }
                }
                catch { /* ignore malformed body */ }
                ctx.Request.Body.Position = 0;
            }
            await next();
        });
        return app;
    }
}
