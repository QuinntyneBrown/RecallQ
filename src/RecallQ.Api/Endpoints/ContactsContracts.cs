using RecallQ.Api.Entities;

namespace RecallQ.Api.Endpoints;

public record PatchContactRequest(bool? Starred);

public record ContactDetailDto(
    Guid Id, string DisplayName, string Initials, string? Role, string? Organization,
    string? Location, string[] Tags, string[] Emails, string[] Phones,
    string? AvatarColorA, string? AvatarColorB, bool Starred, DateTime CreatedAt,
    InteractionDto[] RecentInteractions, int InteractionTotal)
{
    public static ContactDetailDto From(Contact c, InteractionDto[] recent, int total) => new(
        c.Id, c.DisplayName, c.Initials, c.Role, c.Organization, c.Location,
        c.Tags, c.Emails, c.Phones, c.AvatarColorA, c.AvatarColorB, c.Starred, c.CreatedAt,
        recent, total);
}
