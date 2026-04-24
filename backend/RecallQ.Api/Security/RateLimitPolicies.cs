using System.Security.Claims;
using System.Threading.RateLimiting;

namespace RecallQ.Api.Security;

// Traces to: L2-057
// Task: T028
public static class RateLimitPolicies
{
    public const string LoginEmailItemKey = "login-email";

    public static IServiceCollection AddRecallQRateLimits(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;

            // login: 5 per 60s keyed by ip+email
            options.AddPolicy(LoginRateLimit.PolicyName, httpCtx =>
            {
                var ip = httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var email = httpCtx.Items.TryGetValue(LoginEmailItemKey, out var e) ? e as string ?? "" : "";
                var key = $"{ip}:{email}";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromSeconds(60),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // search: 60 per minute keyed by user
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

            // ask: 20 per minute keyed by user
            options.AddPolicy("ask", httpCtx =>
            {
                var key = httpCtx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // summary: 1 refresh per user per minute (defense-in-depth alongside in-handler guard)
            options.AddPolicy("summary", httpCtx =>
            {
                var key = httpCtx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 1,
                    Window = TimeSpan.FromSeconds(60),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // intro: 20 per minute keyed by user
            options.AddPolicy("intro", httpCtx =>
            {
                var key = httpCtx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });
        });
        return services;
    }
}
