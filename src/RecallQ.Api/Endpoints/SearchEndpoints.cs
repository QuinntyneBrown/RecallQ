using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearch(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search", [Authorize] async (
            string? q, AppDbContext db, ICurrentUser current,
            IEmbeddingClient client, EmbeddingBackfillRunner runner) =>
        {
            var userId = current.UserId!.Value;
            var currentModel = client.Model;

            var ceTotal = await db.ContactEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId).CountAsync();
            var ceMatch = await db.ContactEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId && e.Model == currentModel).CountAsync();
            var ieTotal = await db.InteractionEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId).CountAsync();
            var ieMatch = await db.InteractionEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId && e.Model == currentModel).CountAsync();

            var total = ceTotal + ieTotal;
            var match = ceMatch + ieMatch;
            if (total > 0 && match * 2 < total)
            {
                runner.StartInBackground(userId);
                return Results.Json(new { message = "Embeddings are being regenerated" }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            return Results.Ok(new { items = Array.Empty<object>(), placeholder = true, q });
        });
        return app;
    }
}
