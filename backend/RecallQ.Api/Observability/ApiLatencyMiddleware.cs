using System.Diagnostics;

namespace RecallQ.Api.Observability;

// Traces to: L2-070
// Task: T030
public sealed class ApiLatencyMiddleware
{
    private readonly RequestDelegate _next;

    public ApiLatencyMiddleware(RequestDelegate next) { _next = next; }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            var endpoint = context.GetEndpoint()?.Metadata
                .GetMetadata<Microsoft.AspNetCore.Routing.RouteNameMetadata>()?.RouteName;
            if (string.IsNullOrEmpty(endpoint))
            {
                var routePattern = (context.GetEndpoint() as Microsoft.AspNetCore.Routing.RouteEndpoint)?.RoutePattern?.RawText;
                endpoint = routePattern ?? context.Request.Path.Value ?? "unknown";
            }
            RecallQMetrics.ApiLatencySeconds.WithLabels(endpoint).Observe(sw.Elapsed.TotalSeconds);
        }
    }
}
