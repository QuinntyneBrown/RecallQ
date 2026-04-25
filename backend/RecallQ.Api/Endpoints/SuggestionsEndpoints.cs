using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class SuggestionsEndpoints
{
    public static IEndpointRouteBuilder MapSuggestions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/suggestions", [Authorize] async (
            AppDbContext db, ICurrentUser current, CancellationToken ct) =>
        {
            var cutoff = DateTime.UtcNow.AddDays(-7);
            var row = await db.Suggestions
                .Where(s => s.DismissedAt == null || s.DismissedAt < cutoff)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync(ct);
            if (row is null) return Results.Ok<object?>(null);
            return Results.Ok<object?>(new
            {
                id = row.Id, key = row.Key, kind = row.Kind,
                title = row.Title, body = row.Body,
                actionLabel = row.ActionLabel, actionHref = row.ActionHref,
            });
        });

        app.MapPost("/api/suggestions/{key}/dismiss", [Authorize] async (
            string key, AppDbContext db, ICurrentUser current, CancellationToken ct) =>
        {
            var row = await db.Suggestions.FirstOrDefaultAsync(s => s.Key == key, ct);
            if (row is null) return Results.NotFound();
            row.DismissedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return app;
    }
}
