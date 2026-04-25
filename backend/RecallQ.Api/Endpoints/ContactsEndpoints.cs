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

            var colorPalette = new[] { "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2" };
            var nameHash = displayName.GetHashCode();
            var defaultColorA = colorPalette[Math.Abs(nameHash) % colorPalette.Length];
            var defaultColorB = colorPalette[Math.Abs(nameHash + 1) % colorPalette.Length];

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
                AvatarColorA = req.AvatarColorA ?? defaultColorA,
                AvatarColorB = req.AvatarColorB ?? defaultColorB,
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

            var errors = new Dictionary<string, string[]>();
            if (req.DisplayName is not null)
            {
                var displayName = req.DisplayName.Trim();
                if (displayName.Length < 1 || displayName.Length > 120)
                    errors["displayName"] = new[] { "DisplayName must be 1–120 chars." };
            }
            if (req.Initials is not null)
            {
                var initials = req.Initials.Trim();
                if (initials.Length < 1 || initials.Length > 3)
                    errors["initials"] = new[] { "Initials must be 1–3 chars." };
            }
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var needsEmbedding = false;
            if (req.Starred.HasValue) c.Starred = req.Starred.Value;
            if (req.Emails is not null) c.Emails = req.Emails;
            if (req.Phones is not null) c.Phones = req.Phones;
            if (req.DisplayName is not null) { c.DisplayName = req.DisplayName.Trim(); needsEmbedding = true; }
            if (req.Initials is not null) { c.Initials = req.Initials.Trim(); }
            if (req.Role is not null) { c.Role = req.Role.Trim(); needsEmbedding = true; }
            if (req.Organization is not null) { c.Organization = req.Organization.Trim(); needsEmbedding = true; }
            if (req.Location is not null) { c.Location = req.Location.Trim(); needsEmbedding = true; }
            if (req.Tags is not null) { c.Tags = req.Tags; needsEmbedding = true; }

            await db.SaveChangesAsync();
            if (needsEmbedding)
                await embeddingWriter.WriteAsync(new EmbeddingJob(c.Id, current.UserId!.Value, "contact"));

            var total = await db.Interactions.CountAsync(i => i.ContactId == id);
            var rows = await db.Interactions.Where(i => i.ContactId == id)
                .OrderByDescending(i => i.OccurredAt).Take(3).ToListAsync();
            return Results.Ok(ContactDetailDto.From(c, rows.Select(InteractionDto.From).ToArray(), total));
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

        app.MapGet("/api/contacts", [Authorize] async (
            AppDbContext db, ICurrentUser current, int? page, int? pageSize, string? sort) =>
        {
            var p = page is null or < 1 ? 1 : page.Value;
            var ps = pageSize is null or < 1 ? 20 : Math.Min(pageSize.Value, 100);
            var query = db.Contacts.Where(c => c.OwnerUserId == current.UserId).AsQueryable();
            query = (sort ?? "recent") switch
            {
                "createdAt_asc" => query.OrderBy(c => c.CreatedAt),
                "createdAt_desc" => query.OrderByDescending(c => c.CreatedAt),
                "name" or "name_asc" => query.OrderBy(c => c.DisplayName),
                "name_desc" => query.OrderByDescending(c => c.DisplayName),
                _ => query.OrderByDescending(c =>
                    db.Interactions.Where(i => i.ContactId == c.Id).Max(i => (DateTime?)i.OccurredAt) ?? c.CreatedAt),
            };
            var totalCount = await query.CountAsync();
            var rows = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();
            var items = new List<ContactListDto>();
            foreach (var row in rows)
            {
                var interactionTotal = await db.Interactions.CountAsync(i => i.ContactId == row.Id);
                var lastInteraction = await db.Interactions.Where(i => i.ContactId == row.Id)
                    .OrderByDescending(i => i.OccurredAt).Select(i => (DateTime?)i.OccurredAt).FirstOrDefaultAsync();
                items.Add(ContactListDto.From(row, interactionTotal, lastInteraction));
            }
            var nextPage = totalCount > p * ps ? p + 1 : (int?)null;
            return Results.Ok(new { items, totalCount, page = p, pageSize = ps, nextPage });
        });

        app.MapGet("/api/contacts/count", [Authorize] async (AppDbContext db) =>
        {
            var contacts = await db.Contacts.CountAsync();
            var interactions = await db.Interactions.CountAsync();
            return Results.Ok(new { contacts, interactions });
        });

        return app;
    }
}
