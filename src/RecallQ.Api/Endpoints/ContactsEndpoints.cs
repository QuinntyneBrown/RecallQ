using System.Threading.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;

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
            ChannelWriter<EmbeddingJob> embeddingWriter) =>
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
            await embeddingWriter.WriteAsync(new EmbeddingJob(contact.Id, contact.OwnerUserId));
            return Results.Created($"/api/contacts/{contact.Id}", ContactDto.From(contact));
        });

        app.MapGet("/api/contacts/{id:guid}", [Authorize] async (Guid id, AppDbContext db) =>
        {
            var c = await db.Contacts.FirstOrDefaultAsync(x => x.Id == id);
            return c is null ? Results.NotFound() : Results.Ok(ContactDto.From(c));
        });

        return app;
    }
}
