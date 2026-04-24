using Serilog.Context;

namespace RecallQ.Api.Observability;

// Traces to: L2-069
// Task: T030
public sealed class CorrelationMiddleware
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemKey = "CorrelationId";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationMiddleware> _logger;

    public CorrelationMiddleware(RequestDelegate next, ILogger<CorrelationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string id;
        if (context.Request.Headers.TryGetValue(HeaderName, out var provided)
            && !string.IsNullOrWhiteSpace(provided.ToString()))
        {
            id = provided.ToString();
        }
        else
        {
            id = Guid.NewGuid().ToString("N");
        }

        context.Items[ItemKey] = id;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = id;
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("CorrelationId", id))
        {
            _logger.LogInformation("request_started method={Method} path={Path}", context.Request.Method, context.Request.Path.Value);
            await _next(context);
            _logger.LogInformation("request_completed status={Status}", context.Response.StatusCode);
        }
    }
}
