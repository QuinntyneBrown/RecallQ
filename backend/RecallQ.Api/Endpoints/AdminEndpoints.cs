using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Security;
using RecallQ.Api.Suggestions;

namespace RecallQ.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdmin(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin");
        group.AddEndpointFilter(async (ctx, next) =>
        {
            if (!string.Equals(Environment.GetEnvironmentVariable("ADMIN_ENABLED"), "true", StringComparison.Ordinal))
                return Results.NotFound();
            return await next(ctx);
        });

        group.MapPost("/embeddings/backfill", [Authorize] (ICurrentUser current, EmbeddingBackfillRunner runner) =>
        {
            var userId = current.UserId!.Value;
            runner.StartInBackground(userId);
            return Results.Accepted(value: new { status = "accepted", ownerUserId = userId });
        });

        group.MapGet("/embeddings/status", [Authorize] async (AppDbContext db, CancellationToken ct) =>
        {
            var contactsFailed = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.Failed, ct);
            var interactionsFailed = await db.InteractionEmbeddings.IgnoreQueryFilters().CountAsync(e => e.Failed, ct);
            return Results.Ok(new { contactsFailed, interactionsFailed });
        });

        group.MapPost("/detect-suggestions", [Authorize] async (ICurrentUser current, SuggestionDetector detector, CancellationToken ct) =>
        {
            var userId = current.UserId!.Value;
            await detector.DetectOnceAsync(userId, ct);
            return Results.Ok(new { status = "ok", ownerUserId = userId });
        });

        return app;
    }
}
