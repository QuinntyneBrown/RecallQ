using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Security;

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

        return app;
    }
}
