using System.Text.Json;

namespace RecallQ.Api.Security;

public class BearerInQueryMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<BearerInQueryMiddleware> _logger;

    public BearerInQueryMiddleware(RequestDelegate next, ILogger<BearerInQueryMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Query.ContainsKey("token")
            || context.Request.Query.ContainsKey("access_token"))
        {
            _logger.LogWarning("BearerInQueryRejected path={path}", context.Request.Path.Value);
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { error = "bearer_in_query_forbidden" }));
            return;
        }
        await _next(context);
    }
}

public static class BearerInQueryMiddlewareExtensions
{
    public static IApplicationBuilder UseBearerInQueryRejection(this IApplicationBuilder app)
        => app.UseMiddleware<BearerInQueryMiddleware>();
}
