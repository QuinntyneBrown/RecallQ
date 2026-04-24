using System.Threading.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class SummariesEndpoints
{
    public static IEndpointRouteBuilder MapSummaries(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/contacts/{id:guid}/summary", [Authorize] async (
            Guid id, AppDbContext db, ICurrentUser current,
            ChannelWriter<SummaryRefreshJob> writer) =>
        {
            var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
            if (contact is null) return Results.NotFound();

            var row = await db.RelationshipSummaries.FirstOrDefaultAsync(r => r.ContactId == id);
            if (row is null)
            {
                var interactionCount = await db.Interactions.CountAsync(i => i.ContactId == id);
                if (interactionCount == 0)
                    return Results.Ok(new { status = "not_enough_data" });
                await writer.WriteAsync(new SummaryRefreshJob(id, current.UserId!.Value));
                return Results.Ok(new { status = "pending" });
            }

            if (row.Paragraph is null && row.InteractionCount == 0)
                return Results.Ok(new { status = "not_enough_data" });

            if (row.Paragraph is null)
                return Results.Ok(new { status = "pending" });

            return Results.Ok(new
            {
                status = "ready",
                paragraph = row.Paragraph,
                sentiment = row.Sentiment,
                interactionCount = row.InteractionCount,
                lastInteractionAt = row.LastInteractionAt,
                updatedAt = row.UpdatedAt,
            });
        });

        app.MapPost("/api/contacts/{id:guid}/summary:refresh", [Authorize] async (
            Guid id, AppDbContext db, ICurrentUser current,
            ChannelWriter<SummaryRefreshJob> writer) =>
        {
            var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
            if (contact is null) return Results.NotFound();

            var row = await db.RelationshipSummaries.FirstOrDefaultAsync(r => r.ContactId == id);
            var now = DateTime.UtcNow;
            if (row is not null && row.LastRefreshRequestedAt is DateTime last && (now - last).TotalSeconds < 60)
                return Results.StatusCode(429);

            if (row is null)
            {
                row = new Entities.RelationshipSummary
                {
                    ContactId = id,
                    OwnerUserId = current.UserId!.Value,
                    Sentiment = "None",
                    Model = "",
                    SourceHash = "",
                    LastRefreshRequestedAt = now,
                    UpdatedAt = now,
                };
                db.RelationshipSummaries.Add(row);
            }
            else
            {
                row.LastRefreshRequestedAt = now;
            }
            await db.SaveChangesAsync();
            await writer.WriteAsync(new SummaryRefreshJob(id, current.UserId!.Value));
            return Results.Accepted();
        }).RequireRateLimiting("summary");

        return app;
    }
}
