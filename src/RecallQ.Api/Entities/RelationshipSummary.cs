namespace RecallQ.Api.Entities;

public class RelationshipSummary
{
    public Guid ContactId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string? Paragraph { get; set; }
    public string Sentiment { get; set; } = "None";
    public int InteractionCount { get; set; }
    public DateTime? LastInteractionAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastRefreshRequestedAt { get; set; }
    public string Model { get; set; } = "";
    public string SourceHash { get; set; } = "";
}
