using System.Threading.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class InteractionsEndpoints
{
    private static bool TryParseType(string? v, out InteractionType t)
        => Enum.TryParse(v, true, out t) && Enum.IsDefined(t);

    private static IResult? ValidateContent(string? content)
        => (content?.Length ?? 0) > 8000
            ? Results.ValidationProblem(new Dictionary<string, string[]> { ["content"] = new[] { "Content must be 0–8000 chars." } })
            : null;

    public static IEndpointRouteBuilder MapInteractions(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/contacts/{contactId:guid}/interactions", [Authorize] async (
            Guid contactId, CreateInteractionRequest req, AppDbContext db, ICurrentUser current,
            ChannelWriter<EmbeddingJob> emb, ChannelWriter<SummaryRefreshJob> sum) =>
        {
            var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == contactId);
            if (contact is null) return Results.NotFound();
            if (!TryParseType(req.Type, out var type))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["type"] = new[] { "Invalid type." } });
            var badContent = ValidateContent(req.Content);
            if (badContent is not null) return badContent;

            var ownerId = current.UserId!.Value;
            var i = new Interaction
            {
                ContactId = contactId, OwnerUserId = ownerId, Type = type,
                OccurredAt = req.OccurredAt, Subject = req.Subject, Content = req.Content ?? "",
            };
            db.Interactions.Add(i);
            await db.SaveChangesAsync();
            await emb.WriteAsync(new EmbeddingJob(i.Id, ownerId, "interaction"));
            await sum.WriteAsync(new SummaryRefreshJob(contactId, ownerId));
            return Results.Created($"/api/interactions/{i.Id}", InteractionDto.From(i));
        });

        app.MapPatch("/api/interactions/{id:guid}", [Authorize] async (
            Guid id, PatchInteractionRequest req, AppDbContext db, ICurrentUser current,
            ChannelWriter<EmbeddingJob> emb, ChannelWriter<SummaryRefreshJob> sum) =>
        {
            var i = await db.Interactions.FirstOrDefaultAsync(x => x.Id == id);
            if (i is null) return Results.NotFound();
            if (req.Type is not null)
            {
                if (!TryParseType(req.Type, out var t))
                    return Results.ValidationProblem(new Dictionary<string, string[]> { ["type"] = new[] { "Invalid type." } });
                i.Type = t;
            }
            if (req.OccurredAt.HasValue) i.OccurredAt = req.OccurredAt.Value;
            if (req.Subject is not null) i.Subject = req.Subject;
            if (req.Content is not null)
            {
                var bad = ValidateContent(req.Content);
                if (bad is not null) return bad;
                i.Content = req.Content;
            }
            await db.SaveChangesAsync();
            await emb.WriteAsync(new EmbeddingJob(i.Id, current.UserId!.Value, "interaction"));
            await sum.WriteAsync(new SummaryRefreshJob(i.ContactId, current.UserId!.Value));
            return Results.Ok(InteractionDto.From(i));
        });

        app.MapDelete("/api/interactions/{id:guid}", [Authorize] async (
            Guid id, AppDbContext db, ICurrentUser current, ChannelWriter<SummaryRefreshJob> sum) =>
        {
            var i = await db.Interactions.FirstOrDefaultAsync(x => x.Id == id);
            if (i is null) return Results.NotFound();
            var contactId = i.ContactId;
            db.Interactions.Remove(i);
            await db.SaveChangesAsync();
            await sum.WriteAsync(new SummaryRefreshJob(contactId, current.UserId!.Value));
            return Results.NoContent();
        });

        return app;
    }
}
