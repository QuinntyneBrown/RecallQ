namespace RecallQ.Api.Entities;

public class Interaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContactId { get; set; }
    public Guid OwnerUserId { get; set; }
    public InteractionType Type { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Subject { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
