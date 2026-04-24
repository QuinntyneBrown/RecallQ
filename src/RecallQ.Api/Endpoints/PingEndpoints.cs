namespace RecallQ.Api.Endpoints;

public static class PingEndpoints
{
    public static IEndpointRouteBuilder MapPing(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/ping", () => "pong");
        return app;
    }
}
