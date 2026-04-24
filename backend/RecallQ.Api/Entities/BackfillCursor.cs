namespace RecallQ.Api.Entities;

public class BackfillCursor
{
    public Guid OwnerUserId { get; set; }
    public string Table { get; set; } = string.Empty;
    public DateTime LastProcessedCreatedAt { get; set; } = DateTime.MinValue;
    public Guid LastProcessedId { get; set; } = Guid.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool Completed { get; set; } = false;
}
