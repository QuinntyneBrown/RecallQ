namespace RecallQ.Api.Security;

// Traces to: L2-057
// Task: T028
public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    private const string CspValue =
        "default-src 'self'; " +
        "connect-src 'self' https://api.openai.com; " +
        "img-src 'self' data:; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "frame-ancestors 'none'";

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var h = context.Response.Headers;
            h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            h["Content-Security-Policy"] = CspValue;
            h["X-Content-Type-Options"] = "nosniff";
            h["Referrer-Policy"] = "strict-origin-when-cross-origin";
            h["X-Frame-Options"] = "DENY";
            return Task.CompletedTask;
        });
        return _next(context);
    }
}
