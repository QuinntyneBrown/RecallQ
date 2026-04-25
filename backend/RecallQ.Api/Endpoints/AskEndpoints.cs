using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using RecallQ.Api.Chat;
using RecallQ.Api.Observability;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class AskEndpoints
{
    public record AskRequest(string? Q, Guid? ContactId);

    private const string SystemPrompt = "You are RecallQ, answer briefly based on what the user provides.";

    public static IEndpointRouteBuilder MapAsk(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/ask", Handle)
            .RequireAuthorization()
            .RequireRateLimiting("ask");
        return app;
    }

    private static async Task Handle(AskRequest? req, HttpContext http, IChatClient client, CitationRetriever retriever, FollowUpGenerator followUpGen, ICurrentUser current, AppDbContext db, ILoggerFactory lf)
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

        var sysBuilder = new StringBuilder();
        if (req?.ContactId is Guid cid && current.UserId is Guid)
        {
            var c = db.Contacts.FirstOrDefault(x => x.Id == cid);
            if (c is not null)
            {
                sysBuilder.AppendLine($"The user is focused on contact: {c.DisplayName} (role: {c.Role ?? "-"}, org: {c.Organization ?? "-"}).");
            }
        }
        sysBuilder.Append(SystemPrompt);

        IReadOnlyList<Citation> citations = Array.Empty<Citation>();
        if (current.UserId is Guid ownerId)
        {
            try { citations = await retriever.RetrieveAsync(ownerId, q, 3, http.RequestAborted, biasContactId: req?.ContactId); }
            catch (Exception ex) { logger.LogWarning(ex, "citation_retrieval_failed"); }
        }

        http.Response.Headers["Content-Type"] = "text/event-stream";
        http.Response.Headers["Cache-Control"] = "no-cache";
        http.Response.Headers["X-Accel-Buffering"] = "no";
        await http.Response.Body.FlushAsync(http.RequestAborted);

        var messages = new List<ChatMessage>
        {
            new("system", sysBuilder.ToString()),
            new("user", q),
        };

        var answer = new StringBuilder();
        await foreach (var token in client.StreamAsync(messages, http.RequestAborted))
        {
            answer.Append(token);
            var json = JsonSerializer.Serialize(new { token });
            await http.Response.WriteAsync($"data: {json}\n\n", http.RequestAborted);
            await http.Response.Body.FlushAsync(http.RequestAborted);
        }

        if (citations.Count > 0)
        {
            var items = citations.Select(c => new { contactId = c.ContactId, contactName = c.ContactName, snippet = c.Snippet, similarity = c.Similarity, source = c.Source });
            var payload = JsonSerializer.Serialize(new { items });
            await http.Response.WriteAsync($"event: citations\ndata: {payload}\n\n", http.RequestAborted);
            await http.Response.Body.FlushAsync(http.RequestAborted);
        }

        var followUps = await followUpGen.GenerateAsync(q, answer.ToString(), http.RequestAborted);
        var fuPayload = JsonSerializer.Serialize(new { items = followUps });
        await http.Response.WriteAsync($"event: followups\ndata: {fuPayload}\n\n", http.RequestAborted);
        await http.Response.Body.FlushAsync(http.RequestAborted);

        await http.Response.WriteAsync("event: done\ndata: {}\n\n", http.RequestAborted);
        await http.Response.Body.FlushAsync(http.RequestAborted);

        RecallQMetrics.LlmTokensTotal.WithLabels("ask", "in").Inc(q.Length / 4);
        RecallQMetrics.LlmTokensTotal.WithLabels("ask", "out").Inc(answer.Length / 4);
    }
}
