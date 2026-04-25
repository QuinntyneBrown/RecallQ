using System.Threading.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;
using RecallQ.Api.Stacks;

namespace RecallQ.Api.Endpoints;

public static class ContactsEndpoints
{
    public record CreateContactRequest(
        string? DisplayName, string? Initials, string? Role, string? Organization,
        string? Location, string[]? Tags, string[]? Emails, string[]? Phones,
        string? AvatarColorA, string? AvatarColorB);

    public record ContactDto(
        Guid Id, string DisplayName, string Initials, string? Role, string? Organization,
        string? Location, string[] Tags, string[] Emails, string[] Phones,
        string? AvatarColorA, string? AvatarColorB, DateTime CreatedAt)
    {
        public static ContactDto From(Contact c) => new(
            c.Id, c.DisplayName, c.Initials, c.Role, c.Organization, c.Location,
            c.Tags, c.Emails, c.Phones, c.AvatarColorA, c.AvatarColorB, c.CreatedAt);
    }

    public static IEndpointRouteBuilder MapContacts(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/contacts", [Authorize] async (
            CreateContactRequest req, AppDbContext db, ICurrentUser current,
            ChannelWriter<EmbeddingJob> embeddingWriter, StackCountCache stackCache) =>
        {
            var errors = new Dictionary<string, string[]>();
            var displayName = (req.DisplayName ?? "").Trim();
            var initials = (req.Initials ?? "").Trim();
            if (displayName.Length < 1 || displayName.Length > 120)
                errors["displayName"] = new[] { "DisplayName must be 1–120 chars." };
            if (initials.Length < 1 || initials.Length > 3)
                errors["initials"] = new[] { "Initials must be 1–3 chars." };
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var contact = new Contact
            {
                OwnerUserId = current.UserId!.Value,
                DisplayName = displayName,
                Initials = initials,
                Role = req.Role,
                Organization = req.Organization,
                Location = req.Location,
                Tags = req.Tags ?? Array.Empty<string>(),
                Emails = req.Emails ?? Array.Empty<string>(),
                Phones = req.Phones ?? Array.Empty<string>(),
                AvatarColorA = req.AvatarColorA,
                AvatarColorB = req.AvatarColorB,
            };
            db.Contacts.Add(contact);
            await db.SaveChangesAsync();
            stackCache.InvalidateOwner(current.UserId!.Value);
            await embeddingWriter.WriteAsync(new EmbeddingJob(contact.Id, contact.OwnerUserId, "contact"));
            return Results.Created($"/api/contacts/{contact.Id}", ContactDto.From(contact));
        });

        app.MapGet("/api/contacts/{id:guid}", [Authorize] async (Guid id, AppDbContext db, int? take) =>
        {
            var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return Results.NotFound();
            var n = take is null or < 1 ? 3 : Math.Min(take.Value, 50);
            var total = await db.Interactions.CountAsync(i => i.ContactId == id);
            var rows = await db.Interactions.Where(i => i.ContactId == id)
                .OrderByDescending(i => i.OccurredAt).Take(n).ToListAsync();
            var recent = rows.Select(InteractionDto.From).ToArray();
            return Results.Ok(ContactDetailDto.From(c, recent, total));
        });

        app.MapPatch("/api/contacts/{id:guid}", [Authorize] async (
            Guid id, PatchContactRequest req, AppDbContext db,
            ChannelWriter<EmbeddingJob> embeddingWriter, ICurrentUser current) =>
        {
            var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return Results.NotFound();
            if (req.Starred.HasValue) c.Starred = req.Starred.Value;
            if (req.Emails is not null) c.Emails = req.Emails;
            if (req.Phones is not null) c.Phones = req.Phones;
            await db.SaveChangesAsync();
            await embeddingWriter.WriteAsync(new EmbeddingJob(c.Id, current.UserId!.Value, "contact"));
            var total = await db.Interactions.CountAsync(i => i.ContactId == id);
            var rows = await db.Interactions.Where(i => i.ContactId == id)
                .OrderByDescending(i => i.OccurredAt).Take(3).ToListAsync();
            return Results.Ok(ContactDetailDto.From(c, rows.Select(InteractionDto.From).ToArray(), total));
        });

        app.MapGet("/api/contacts", [Authorize] async (
            AppDbContext db, int? page, int? pageSize, string? sort) =>
        {
            var p = page is null or < 1 ? 1 : page.Value;
            var ps = pageSize is null or < 1 ? 20 : Math.Min(pageSize.Value, 100);
            var query = db.Contacts.AsQueryable();
            query = (sort ?? "recent") switch
            {
                "createdAt_asc" => query.OrderBy(c => c.CreatedAt),
                "createdAt_desc" => query.OrderByDescending(c => c.CreatedAt),
                "name_asc" => query.OrderBy(c => c.DisplayName),
                "name_desc" => query.OrderByDescending(c => c.DisplayName),
                _ => query.OrderByDescending(c =>
                    db.Interactions.Where(i => i.ContactId == c.Id).Max(i => (DateTime?)i.OccurredAt) ?? c.CreatedAt),
            };
            var totalCount = await query.CountAsync();
            var rows = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();
            var items = rows.Select(ContactDto.From).ToArray();
            var nextPage = totalCount > p * ps ? p + 1 : (int?)null;
            return Results.Ok(new { items, totalCount, page = p, pageSize = ps, nextPage });
        });

        app.MapGet("/api/contacts/count", [Authorize] async (AppDbContext db) =>
        {
            var contacts = await db.Contacts.CountAsync();
            var interactions = await db.Interactions.CountAsync();
            return Results.Ok(new { contacts, interactions });
        });

        app.MapDelete("/api/contacts/{id:guid}", [Authorize] async (
            Guid id, AppDbContext db, ICurrentUser current, StackCountCache stackCache) =>
        {
            var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return Results.NotFound();
            db.Contacts.Remove(c);
            await db.SaveChangesAsync();
            stackCache.InvalidateOwner(current.UserId!.Value);
            return Results.NoContent();
        });

        return app;
    }
}
