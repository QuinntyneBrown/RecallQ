using RecallQ.Api.Entities;

namespace RecallQ.Api.Endpoints;

public record CreateInteractionRequest(string? Type, DateTime OccurredAt, string? Subject, string? Content);

public record PatchInteractionRequest(string? Type, DateTime? OccurredAt, string? Subject, string? Content);

public record InteractionDto(
    Guid Id, Guid ContactId, string Type, DateTime OccurredAt,
    string? Subject, string Content, DateTime CreatedAt)
{
    public static InteractionDto From(Interaction i) => new(
        i.Id, i.ContactId, i.Type.ToString().ToLowerInvariant(), i.OccurredAt,
        i.Subject, i.Content, i.CreatedAt);
}
