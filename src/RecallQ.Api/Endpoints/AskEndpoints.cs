using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using RecallQ.Api.Chat;

namespace RecallQ.Api.Endpoints;

public static class AskEndpoints
{
    public record AskRequest(string? Q);

    private const string SystemPrompt = "You are RecallQ, answer briefly based on what the user provides.";

    public static IEndpointRouteBuilder MapAsk(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/ask", Handle)
            .RequireAuthorization()
            .RequireRateLimiting("ask");
        return app;
    }

    private static async Task Handle(AskRequest? req, HttpContext http, IChatClient client, ILoggerFactory lf)
    {
        var logger = lf.CreateLogger("Ask");
        var q = (req?.Q ?? string.Empty).Trim();
        if (q.Length == 0 || q.Length > 1000)
        {
            http.Response.StatusCode = StatusCodes.Status400BadRequest;
            await http.Response.WriteAsJsonAsync(new { error = "q must be 1..1000 chars" }, http.RequestAborted);
            return;
        }

        var hashHex = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(q))).ToLowerInvariant()[..12];
        logger.LogInformation("Ask q_len={len} q_hash={hash}", q.Length, hashHex);

        http.Response.Headers["Content-Type"] = "text/event-stream";
        http.Response.Headers["Cache-Control"] = "no-cache";
        http.Response.Headers["X-Accel-Buffering"] = "no";
        await http.Response.Body.FlushAsync(http.RequestAborted);

        var messages = new List<ChatMessage>
        {
            new("system", SystemPrompt),
            new("user", q),
        };

        await foreach (var token in client.StreamAsync(messages, http.RequestAborted))
        {
            var json = JsonSerializer.Serialize(new { token });
            await http.Response.WriteAsync($"data: {json}\n\n", http.RequestAborted);
            await http.Response.Body.FlushAsync(http.RequestAborted);
        }

        await http.Response.WriteAsync("event: done\ndata: {}\n\n", http.RequestAborted);
        await http.Response.Body.FlushAsync(http.RequestAborted);
    }
}
