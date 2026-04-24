using System.Text.Json;

namespace RecallQ.Api.Security;

public static class LoginRateLimit
{
    public const string PolicyName = "login";

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
                        ctx.Items[RateLimitPolicies.LoginEmailItemKey] = emailEl.GetString()?.Trim().ToLowerInvariant() ?? "";
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
