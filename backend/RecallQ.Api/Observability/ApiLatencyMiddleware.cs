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
                endpoint = (context.GetEndpoint() as Microsoft.AspNetCore.Routing.RouteEndpoint)?.RoutePattern?.RawText
                    ?? "unmatched";
            }
            var status = context.Response.StatusCode.ToString();
            RecallQMetrics.ApiLatencySeconds.WithLabels(endpoint, status).Observe(sw.Elapsed.TotalSeconds);
            RecallQMetrics.HttpRequestsTotal.WithLabels(endpoint, status).Inc();
        }
    }
}
